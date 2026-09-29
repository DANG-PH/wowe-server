import 'reflect-metadata';
import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { DiscountType } from '../common/enums/coupon.enum';
import { ProductStatus } from '../common/enums/product-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { slugify } from '../common/utils/slug.util';
import { Category } from '../entities/category.entity';
import { Coupon } from '../entities/coupon.entity';
import { ProductImage } from '../entities/product-image.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { Product } from '../entities/product.entity';
import { Review } from '../entities/review.entity';
import { User } from '../entities/user.entity';
import AppDataSource from './data-source';
import {
  ADMIN_USER,
  CATEGORIES,
  COLORS,
  COUPONS,
  DEMO_CUSTOMER,
  PoolKey,
  PRODUCT_GROUPS,
  SAMPLE_REVIEWS,
} from './seed-data';

const DUMMY_CATEGORIES: Record<PoolKey, string> = {
  dress: 'womens-dresses',
  top: 'tops',
  bag: 'womens-bags',
  shoe: 'womens-shoes',
};

/** Lấy pool ảnh thật (women fashion) từ dummyjson khi seed. Lỗi thì trả rỗng. */
async function fetchImagePool(): Promise<Record<PoolKey, string[]>> {
  const pool: Record<PoolKey, string[]> = {
    top: [],
    dress: [],
    bag: [],
    shoe: [],
  };
  for (const key of Object.keys(DUMMY_CATEGORIES) as PoolKey[]) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(
        `https://dummyjson.com/products/category/${DUMMY_CATEGORIES[key]}?limit=40&select=images,thumbnail`,
        { signal: controller.signal },
      );
      clearTimeout(timer);
      const json = (await res.json()) as {
        products: { images?: string[]; thumbnail?: string }[];
      };
      pool[key] = json.products
        .flatMap((p) => (p.images?.length ? p.images : [p.thumbnail]))
        .filter((u): u is string => !!u);
      console.log(`  • pool[${key}]: ${pool[key].length} ảnh`);
    } catch {
      console.log(`  • pool[${key}]: không tải được, dùng ảnh thay thế`);
    }
  }
  return pool;
}

function pickImages(
  pool: Record<PoolKey, string[]>,
  key: PoolKey,
  count: number,
  seed: number,
): string[] {
  const urls = pool[key];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    if (urls.length) {
      out.push(urls[(seed + i) % urls.length]);
    } else {
      out.push(`https://picsum.photos/seed/wowe-${key}-${seed}-${i}/600/800`);
    }
  }
  return out;
}

function roundPrice(v: number): number {
  return Math.round(v / 1000) * 1000;
}

function randPrice([min, max]: [number, number]): number {
  return roundPrice(min + Math.random() * (max - min));
}

function pickColors(preset?: string[]): string[] {
  if (preset) return preset;
  const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3 + Math.floor(Math.random() * 2));
}

function buildTags(): string[] {
  const all = ['Mới về', 'Bán chạy', 'Xu hướng', 'Basic', 'Đi làm', 'Đi chơi'];
  return all.filter(() => Math.random() < 0.35).slice(0, 3);
}

async function uniqueSlug(
  repo: Repository<Product>,
  name: string,
): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let i = 1;
  while (await repo.exists({ where: { slug } })) slug = `${base}-${i++}`;
  return slug;
}

async function clearAll(): Promise<void> {
  const tables = [
    'order_items',
    'orders',
    'cart_items',
    'carts',
    'reviews',
    'wishlists',
    'product_variants',
    'product_images',
    'products',
    'categories',
    'brands',
    'coupons',
    'addresses',
    'users',
  ];
  await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of tables) {
    await AppDataSource.query(`TRUNCATE TABLE \`${t}\``);
  }
  await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function main() {
  const reset = process.argv.includes('--reset');
  await AppDataSource.initialize();
  console.log('✔ Đã kết nối MySQL');
  // Đảm bảo schema tồn tại (dev). Production dùng migration.
  await AppDataSource.synchronize();

  const productRepo = AppDataSource.getRepository(Product);
  const existing = await productRepo.count();
  if (existing > 0 && !reset) {
    console.log(
      `Đã có ${existing} sản phẩm. Chạy "npm run seed:reset" để tạo lại. Bỏ qua.`,
    );
    await AppDataSource.destroy();
    return;
  }
  if (reset) {
    console.log('Xoá dữ liệu cũ...');
    await clearAll();
  }

  // 1) Danh mục
  const catRepo = AppDataSource.getRepository(Category);
  const catByName = new Map<string, Category>();
  let sort = 0;
  for (const c of CATEGORIES) {
    const parent = await catRepo.save(
      catRepo.create({
        name: c.name,
        slug: slugify(c.name),
        description: c.description ?? null,
        sortOrder: sort++,
      }),
    );
    catByName.set(c.name, parent);
    let cs = 0;
    for (const childName of c.children ?? []) {
      const child = await catRepo.save(
        catRepo.create({
          name: childName,
          slug: slugify(childName),
          parent,
          sortOrder: cs++,
        }),
      );
      catByName.set(childName, child);
    }
  }
  console.log(`✔ Tạo ${catByName.size} danh mục`);

  // 2) Ảnh
  console.log('Đang tải pool ảnh sản phẩm...');
  const pool = await fetchImagePool();

  // 3) Sản phẩm + biến thể
  let created = 0;
  let groupIndex = 0;
  const allProducts: Product[] = [];
  for (const group of PRODUCT_GROUPS) {
    const category = catByName.get(group.category) ?? null;
    let nameIndex = 0;
    for (const name of group.names) {
      const price = randPrice(group.priceRange);
      const salePrice =
        Math.random() < 0.35
          ? roundPrice(price * (0.7 + Math.random() * 0.2))
          : null;
      const colors = pickColors(group.colors);
      const seed = groupIndex * 100 + nameIndex;
      const images = pickImages(pool, group.poolKey, 3, seed).map((url, i) =>
        Object.assign(new ProductImage(), { url, sortOrder: i }),
      );
      const variants: ProductVariant[] = [];
      for (const color of colors) {
        for (const size of group.sizes) {
          variants.push(
            Object.assign(new ProductVariant(), {
              size,
              color,
              sku: `${slugify(name)}-${slugify(size)}-${slugify(color)}-${Math.random()
                .toString(36)
                .slice(2, 6)}`.toUpperCase(),
              stock: Math.random() < 0.1 ? 0 : 5 + Math.floor(Math.random() * 80),
              priceOverride: null,
            }),
          );
        }
      }
      const product = productRepo.create({
        name,
        slug: await uniqueSlug(productRepo, name),
        description: `${name} chất liệu ${group.material.toLowerCase()}. Thiết kế trẻ trung, tôn dáng, dễ phối đồ cho nhiều dịp. Sản phẩm thuộc bộ sưu tập thời trang nữ WoWe.`,
        material: group.material,
        price,
        salePrice,
        category,
        isFeatured: Math.random() < 0.15,
        status: ProductStatus.ACTIVE,
        tags: buildTags(),
        images,
        variants,
        soldCount: Math.floor(Math.random() * 500),
      });
      allProducts.push(await productRepo.save(product));
      created++;
      nameIndex++;
    }
    groupIndex++;
  }
  console.log(`✔ Tạo ${created} sản phẩm (kèm ảnh + biến thể)`);

  // 4) Mã giảm giá
  const couponRepo = AppDataSource.getRepository(Coupon);
  for (const c of COUPONS) {
    await couponRepo.save(
      couponRepo.create({
        code: c.code,
        type: c.type,
        value: c.value,
        minOrder: c.minOrder ?? 0,
        maxDiscount: c.maxDiscount ?? null,
        usageLimit: c.usageLimit ?? 0,
      }),
    );
  }
  console.log(`✔ Tạo ${COUPONS.length} mã giảm giá`);

  // 5) Tài khoản admin + khách demo
  const userRepo = AppDataSource.getRepository(User);
  await userRepo.save(
    userRepo.create({
      email: ADMIN_USER.email,
      passwordHash: await bcrypt.hash(ADMIN_USER.password, 10),
      fullName: ADMIN_USER.fullName,
      role: UserRole.ADMIN,
    }),
  );
  await userRepo.save(
    userRepo.create({
      email: DEMO_CUSTOMER.email,
      passwordHash: await bcrypt.hash(DEMO_CUSTOMER.password, 10),
      fullName: DEMO_CUSTOMER.fullName,
      phone: DEMO_CUSTOMER.phone,
      role: UserRole.CUSTOMER,
    }),
  );
  console.log('✔ Tạo tài khoản admin + khách demo');

  // 6) Đánh giá mẫu cho ~40% sản phẩm
  const reviewRepo = AppDataSource.getRepository(Review);
  let reviewCount = 0;
  for (const product of allProducts) {
    if (Math.random() > 0.4) continue;
    const n = 1 + Math.floor(Math.random() * 4);
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const sample =
        SAMPLE_REVIEWS[Math.floor(Math.random() * SAMPLE_REVIEWS.length)];
      sum += sample.rating;
      await reviewRepo.save(
        reviewRepo.create({
          product,
          authorName: sample.authorName,
          rating: sample.rating,
          title: sample.title,
          content: sample.content,
        }),
      );
      reviewCount++;
    }
    product.ratingCount = n;
    product.ratingAvg = Math.round((sum / n) * 10) / 10;
    await productRepo.save(product);
  }
  console.log(`✔ Tạo ${reviewCount} đánh giá mẫu`);

  await AppDataSource.destroy();
  console.log('\n🎉 Seed hoàn tất!');
  console.log(`   Admin:   ${ADMIN_USER.email} / ${ADMIN_USER.password}`);
  console.log(`   Khách:   ${DEMO_CUSTOMER.email} / ${DEMO_CUSTOMER.password}`);
  console.log(`   Mã giảm: ${COUPONS.map((c) => c.code).join(', ')}`);
}

main().catch((err) => {
  console.error('Seed lỗi:', err);
  process.exit(1);
});
