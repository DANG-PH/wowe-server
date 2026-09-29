import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { paginate, Paginated } from '../../common/dto/paginated';
import { ProductStatus } from '../../common/enums/product-status.enum';
import { slugify } from '../../common/utils/slug.util';
import { ProductImage } from '../../entities/product-image.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { Product } from '../../entities/product.entity';
import { RedisService } from '../../redis/redis.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductSort, QueryProductsDto } from './dto/query-products.dto';

const EFFECTIVE_PRICE = 'COALESCE(product.salePrice, product.price)';
const LIST_CACHE_PREFIX = 'products:list:';
const DETAIL_CACHE_PREFIX = 'products:slug:';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly images: Repository<ProductImage>,
    @InjectRepository(ProductVariant)
    private readonly variants: Repository<ProductVariant>,
    private readonly redis: RedisService,
  ) {}

  async list(query: QueryProductsDto): Promise<Paginated<Product>> {
    const cacheKey =
      LIST_CACHE_PREFIX +
      Buffer.from(JSON.stringify(query)).toString('base64');
    const cached = await this.redis.get<Paginated<Product>>(cacheKey);
    if (cached) return cached;

    const { page, limit } = query;
    const qb = this.products
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .addSelect(EFFECTIVE_PRICE, 'effective_price')
      .where('product.status = :status', { status: ProductStatus.ACTIVE });

    if (query.q) {
      qb.andWhere('product.name LIKE :q', { q: `%${query.q}%` });
    }
    if (query.category) {
      qb.andWhere('category.slug = :categorySlug', {
        categorySlug: query.category,
      });
    }
    if (query.minPrice != null) {
      qb.andWhere(`${EFFECTIVE_PRICE} >= :minPrice`, {
        minPrice: query.minPrice,
      });
    }
    if (query.maxPrice != null) {
      qb.andWhere(`${EFFECTIVE_PRICE} <= :maxPrice`, {
        maxPrice: query.maxPrice,
      });
    }
    if (query.size) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM product_variants pv WHERE pv.productId = product.id AND pv.size = :size)',
        { size: query.size },
      );
    }
    if (query.color) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM product_variants pv WHERE pv.productId = product.id AND pv.color = :color)',
        { color: query.color },
      );
    }
    if (query.isFeatured) {
      qb.andWhere('product.isFeatured = :featured', { featured: true });
    }

    switch (query.sort) {
      case ProductSort.PRICE_ASC:
        qb.orderBy('effective_price', 'ASC');
        break;
      case ProductSort.PRICE_DESC:
        qb.orderBy('effective_price', 'DESC');
        break;
      case ProductSort.BEST_SELLING:
        qb.orderBy('product.soldCount', 'DESC');
        break;
      case ProductSort.RATING:
        qb.orderBy('product.ratingAvg', 'DESC');
        break;
      default:
        qb.orderBy('product.createdAt', 'DESC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    await this.attachImages(items);

    const result = paginate(items, total, page, limit);
    await this.redis.set(cacheKey, result, 60);
    return result;
  }

  async findBySlug(slug: string): Promise<Product> {
    const cacheKey = DETAIL_CACHE_PREFIX + slug;
    const cached = await this.redis.get<Product>(cacheKey);
    if (cached) return cached;

    const product = await this.products.findOne({
      where: { slug },
      relations: ['images', 'variants', 'category', 'brand'],
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    product.images?.sort((a, b) => a.sortOrder - b.sortOrder);

    await this.redis.set(cacheKey, product, 120);
    return product;
  }

  async related(slug: string, take = 8): Promise<Product[]> {
    const product = await this.products.findOne({
      where: { slug },
      relations: ['category'],
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    const qb = this.products
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('product.id != :id', { id: product.id })
      .orderBy('product.soldCount', 'DESC')
      .take(take);
    if (product.category) {
      qb.andWhere('category.id = :categoryId', {
        categoryId: product.category.id,
      });
    }
    const items = await qb.getMany();
    await this.attachImages(items);
    return items;
  }

  // ===== Admin =====

  async create(dto: CreateProductDto): Promise<Product> {
    const slug = await this.uniqueSlug(dto.name);
    const product = this.products.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
      material: dto.material ?? null,
      price: dto.price,
      salePrice: dto.salePrice ?? null,
      category: dto.categoryId ? ({ id: dto.categoryId } as never) : null,
      brand: dto.brandId ? ({ id: dto.brandId } as never) : null,
      isFeatured: dto.isFeatured ?? false,
      status: dto.status ?? ProductStatus.ACTIVE,
      tags: dto.tags ?? null,
      images: (dto.images ?? []).map((img, index) =>
        this.images.create({
          url: img.url,
          sortOrder: img.sortOrder ?? index,
        }),
      ),
      variants: (dto.variants ?? []).map((v) =>
        this.variants.create({
          size: v.size,
          color: v.color,
          sku: v.sku || this.generateSku(slug, v.size, v.color),
          stock: v.stock,
          priceOverride: v.priceOverride ?? null,
        }),
      ),
    });
    const saved = await this.products.save(product);
    await this.invalidateCache();
    return saved;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.products.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    if (dto.name && dto.name !== product.name) {
      product.slug = await this.uniqueSlug(dto.name);
    }
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.material !== undefined) product.material = dto.material;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.salePrice !== undefined) product.salePrice = dto.salePrice ?? null;
    if (dto.isFeatured !== undefined) product.isFeatured = dto.isFeatured;
    if (dto.status !== undefined) product.status = dto.status;
    if (dto.tags !== undefined) product.tags = dto.tags;
    if (dto.categoryId !== undefined) {
      product.category = dto.categoryId
        ? ({ id: dto.categoryId } as never)
        : null;
    }
    if (dto.brandId !== undefined) {
      product.brand = dto.brandId ? ({ id: dto.brandId } as never) : null;
    }
    await this.products.save(product);

    if (dto.images) {
      await this.images.delete({ product: { id } });
      await this.images.save(
        dto.images.map((img, index) =>
          this.images.create({
            url: img.url,
            sortOrder: img.sortOrder ?? index,
            product: { id } as Product,
          }),
        ),
      );
    }
    if (dto.variants) {
      await this.variants.delete({ product: { id } });
      await this.variants.save(
        dto.variants.map((v) =>
          this.variants.create({
            size: v.size,
            color: v.color,
            sku: v.sku || this.generateSku(product.slug, v.size, v.color),
            stock: v.stock,
            priceOverride: v.priceOverride ?? null,
            product: { id } as Product,
          }),
        ),
      );
    }

    await this.invalidateCache();
    return this.products.findOne({
      where: { id },
      relations: ['images', 'variants', 'category', 'brand'],
    }) as Promise<Product>;
  }

  async remove(id: string): Promise<void> {
    const result = await this.products.delete(id);
    if (!result.affected) throw new NotFoundException('Không tìm thấy sản phẩm');
    await this.invalidateCache();
  }

  // ===== Dùng bởi module khác (orders, reviews) =====

  async decrementVariantStock(variantId: string, qty: number): Promise<void> {
    await this.variants.decrement({ id: variantId }, 'stock', qty);
  }

  async increaseSoldCount(productId: string, qty: number): Promise<void> {
    await this.products.increment({ id: productId }, 'soldCount', qty);
    await this.invalidateCache();
  }

  async refreshRating(
    productId: string,
    avg: number,
    count: number,
  ): Promise<void> {
    await this.products.update(productId, {
      ratingAvg: Math.round(avg * 10) / 10,
      ratingCount: count,
    });
    await this.invalidateCache();
  }

  private async attachImages(products: Product[]): Promise<void> {
    if (!products.length) return;
    const ids = products.map((p) => p.id);
    const images = await this.images.find({
      where: { product: { id: In(ids) } },
      relations: ['product'],
      order: { sortOrder: 'ASC' },
    });
    const byProduct = new Map<string, ProductImage[]>();
    for (const image of images) {
      const list = byProduct.get(image.product.id) ?? [];
      list.push(image);
      byProduct.set(image.product.id, list);
      delete (image as Partial<ProductImage>).product;
    }
    for (const product of products) {
      product.images = byProduct.get(product.id) ?? [];
    }
  }

  private async invalidateCache(): Promise<void> {
    await Promise.all([
      this.redis.delByPattern(`${LIST_CACHE_PREFIX}*`),
      this.redis.delByPattern(`${DETAIL_CACHE_PREFIX}*`),
    ]);
  }

  private generateSku(slug: string, size: string, color: string): string {
    const rand = Math.random().toString(36).slice(2, 6);
    return `${slugify(slug)}-${slugify(size)}-${slugify(color)}-${rand}`.toUpperCase();
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    let slug = base;
    let i = 1;
    while (await this.products.exists({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }
}
