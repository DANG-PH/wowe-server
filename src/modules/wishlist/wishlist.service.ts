import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { User } from '../../entities/user.entity';
import { Wishlist } from '../../entities/wishlist.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlists: Repository<Wishlist>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}

  async list(userId: string): Promise<Product[]> {
    const items = await this.wishlists.find({
      where: { user: { id: userId } },
      relations: ['product', 'product.images'],
      order: { createdAt: 'DESC' },
    });
    return items.map((w) => {
      w.product.images?.sort((a, b) => a.sortOrder - b.sortOrder);
      return w.product;
    });
  }

  async add(userId: string, productId: string): Promise<Wishlist> {
    const product = await this.products.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    const existing = await this.wishlists.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });
    if (existing) return existing;

    return this.wishlists.save(
      this.wishlists.create({
        user: { id: userId } as User,
        product: { id: productId } as Product,
      }),
    );
  }

  async remove(userId: string, productId: string): Promise<void> {
    await this.wishlists.delete({
      user: { id: userId },
      product: { id: productId },
    });
  }
}
