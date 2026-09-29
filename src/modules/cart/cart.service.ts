import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from '../../entities/cart-item.entity';
import { Cart } from '../../entities/cart.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { User } from '../../entities/user.entity';
import { AddToCartDto } from './dto/cart.dto';

export function unitPriceOf(item: CartItem): number {
  return (
    item.variant?.priceOverride ??
    item.product.salePrice ??
    item.product.price
  );
}

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private readonly carts: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItems: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private readonly variants: Repository<ProductVariant>,
  ) {}

  async getCartEntity(userId: string): Promise<Cart> {
    let cart = await this.carts.findOne({
      where: { user: { id: userId } },
      relations: [
        'items',
        'items.variant',
        'items.product',
        'items.product.images',
      ],
    });
    if (!cart) {
      cart = await this.carts.save(
        this.carts.create({ user: { id: userId } as User, items: [] }),
      );
      cart.items = [];
    }
    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.getCartEntity(userId);
    return this.toResponse(cart);
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const variant = await this.variants.findOne({
      where: { id: dto.variantId },
      relations: ['product'],
    });
    if (!variant) throw new NotFoundException('Không tìm thấy biến thể sản phẩm');
    if (variant.stock <= 0) throw new BadRequestException('Sản phẩm đã hết hàng');

    const cart = await this.getCartEntity(userId);
    let item = cart.items.find((i) => i.variant.id === dto.variantId);
    if (item) {
      item.quantity += dto.quantity;
    } else {
      item = this.cartItems.create({
        cart: { id: cart.id } as Cart,
        variant,
        product: variant.product,
        quantity: dto.quantity,
      });
    }
    if (item.quantity > variant.stock) item.quantity = variant.stock;
    await this.cartItems.save(item);
    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const item = await this.getOwnedItem(userId, itemId);
    if (quantity === 0) {
      await this.cartItems.remove(item);
      return this.getCart(userId);
    }
    if (quantity > item.variant.stock) {
      throw new BadRequestException(
        `Chỉ còn ${item.variant.stock} sản phẩm trong kho`,
      );
    }
    item.quantity = quantity;
    await this.cartItems.save(item);
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.getOwnedItem(userId, itemId);
    await this.cartItems.remove(item);
    return this.getCart(userId);
  }

  async clear(userId: string) {
    const cart = await this.getCartEntity(userId);
    if (cart.items.length) await this.cartItems.remove(cart.items);
    return this.getCart(userId);
  }

  private async getOwnedItem(
    userId: string,
    itemId: string,
  ): Promise<CartItem> {
    const item = await this.cartItems.findOne({
      where: { id: itemId, cart: { user: { id: userId } } },
      relations: ['variant', 'product', 'cart'],
    });
    if (!item) throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ');
    return item;
  }

  private toResponse(cart: Cart) {
    const items = (cart.items ?? []).map((item) => {
      const unitPrice = unitPriceOf(item);
      return {
        id: item.id,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          image: item.product.images?.[0]?.url ?? null,
        },
        variant: {
          id: item.variant.id,
          size: item.variant.size,
          color: item.variant.color,
          stock: item.variant.stock,
        },
      };
    });
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    return { id: cart.id, items, subtotal, itemCount };
  }
}
