import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { paginate } from '../../common/dto/paginated';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../common/enums/order.enum';
import {
  ORDER_CREATED,
  ORDER_STATUS_CHANGED,
  OrderCreatedEvent,
} from '../../common/events/order-events';
import { CartItem } from '../../entities/cart-item.entity';
import { Coupon } from '../../entities/coupon.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Order } from '../../entities/order.entity';
import { Product } from '../../entities/product.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { User } from '../../entities/user.entity';
import { CartService, unitPriceOf } from '../cart/cart.service';
import { CouponsService } from '../coupons/coupons.service';
import { CheckoutDto } from './dto/checkout.dto';

const FREE_SHIP_THRESHOLD = 500_000;
const SHIPPING_FEE = 30_000;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly cart: CartService,
    private readonly coupons: CouponsService,
    private readonly events: EventEmitter2,
  ) {}

  async checkout(userId: string, dto: CheckoutDto): Promise<Order> {
    const cart = await this.cart.getCartEntity(userId);
    if (!cart.items.length) {
      throw new BadRequestException('Giỏ hàng đang trống');
    }

    const lines = cart.items.map((item) => ({
      item,
      unitPrice: unitPriceOf(item),
    }));
    const subtotal = lines.reduce(
      (sum, l) => sum + l.unitPrice * l.item.quantity,
      0,
    );

    let discount = 0;
    let coupon: Coupon | null = null;
    if (dto.couponCode) {
      const result = await this.coupons.validateAndCompute(
        dto.couponCode,
        subtotal,
      );
      discount = result.discount;
      coupon = result.coupon;
    }

    const shippingFee =
      subtotal - discount >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = subtotal - discount + shippingFee;
    const shippingAddress = `${dto.line}, ${dto.ward}, ${dto.district}, ${dto.province}`;

    const savedOrder = await this.dataSource.transaction(async (manager) => {
      // Khoá và trừ tồn kho từng biến thể để tránh bán vượt
      for (const { item } of lines) {
        const variant = await manager.findOne(ProductVariant, {
          where: { id: item.variant.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!variant || variant.stock < item.quantity) {
          throw new BadRequestException(
            `Sản phẩm "${item.product.name}" không đủ hàng`,
          );
        }
        variant.stock -= item.quantity;
        await manager.save(variant);
        await manager.increment(
          Product,
          { id: item.product.id },
          'soldCount',
          item.quantity,
        );
      }

      const order = manager.create(Order, {
        code: this.generateCode(),
        user: { id: userId } as User,
        subtotal,
        shippingFee,
        discount,
        total,
        status: OrderStatus.PENDING,
        paymentMethod: dto.paymentMethod ?? PaymentMethod.COD,
        paymentStatus: PaymentStatus.UNPAID,
        recipientName: dto.recipientName,
        phone: dto.phone,
        shippingAddress,
        note: dto.note ?? null,
        couponCode: coupon?.code ?? null,
        items: lines.map(({ item, unitPrice }) =>
          manager.create(OrderItem, {
            product: { id: item.product.id } as Product,
            variant: { id: item.variant.id } as ProductVariant,
            productName: item.product.name,
            variantInfo: `${item.variant.size} / ${item.variant.color}`,
            imageUrl: item.product.images?.[0]?.url ?? null,
            price: unitPrice,
            quantity: item.quantity,
          }),
        ),
      });
      const saved = await manager.save(order);

      if (coupon) {
        await manager.increment(Coupon, { id: coupon.id }, 'usedCount', 1);
      }
      await manager.delete(CartItem, { cart: { id: cart.id } });
      return saved;
    });

    this.emitOrderCreated({
      orderId: savedOrder.id,
      code: savedOrder.code,
      total: savedOrder.total,
      email: null,
    });

    return this.findByCode(userId, savedOrder.code, false);
  }

  async findMyOrders(userId: string, pagination: PaginationDto) {
    const { page, limit } = pagination;
    const [items, total] = await this.orders.findAndCount({
      where: { user: { id: userId } },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(items, total, page, limit);
  }

  async findByCode(
    userId: string | null,
    code: string,
    isAdmin: boolean,
  ): Promise<Order> {
    const order = await this.orders.findOne({
      where: { code },
      relations: ['items', 'user'],
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (!isAdmin && order.user?.id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem đơn hàng này');
    }
    return order;
  }

  async cancel(userId: string, code: string): Promise<Order> {
    const order = await this.findByCode(userId, code, false);
    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        'Chỉ huỷ được đơn ở trạng thái chờ xác nhận hoặc đã xác nhận',
      );
    }
    await this.restoreStockAndCancel(order.id);
    const updated = await this.findByCode(userId, code, false);
    this.emitStatusChanged(updated);
    return updated;
  }

  // ===== Admin =====

  async adminFindAll(pagination: PaginationDto, status?: OrderStatus) {
    const { page, limit } = pagination;
    const [items, total] = await this.orders.findAndCount({
      where: status ? { status } : {},
      relations: ['items', 'user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(items, total, page, limit);
  }

  async adminUpdateStatus(code: string, status: OrderStatus): Promise<Order> {
    const order = await this.orders.findOne({ where: { code } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    if (
      status === OrderStatus.CANCELLED &&
      order.status !== OrderStatus.CANCELLED
    ) {
      await this.restoreStockAndCancel(order.id);
    } else {
      order.status = status;
      if (status === OrderStatus.DELIVERED) {
        order.paymentStatus = PaymentStatus.PAID;
      }
      await this.orders.save(order);
    }

    const updated = await this.findByCode(null, code, true);
    this.emitStatusChanged(updated);
    return updated;
  }

  // ===== Xử lý nền (gọi từ OrdersListener) =====

  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    // Mô phỏng nghiệp vụ nền: xác nhận đơn + gửi email xác nhận
    const order = await this.orders.findOne({ where: { id: event.orderId } });
    if (!order || order.status !== OrderStatus.PENDING) return;
    order.status = OrderStatus.CONFIRMED;
    await this.orders.save(order);
    this.logger.log(
      `Đã tự động xác nhận đơn ${event.code}, gửi email xác nhận (mô phỏng). Tổng: ${event.total}đ`,
    );
  }

  private async restoreStockAndCancel(orderId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items'],
      });
      if (!order) return;
      for (const item of order.items) {
        if (item.variant) {
          await manager.increment(
            ProductVariant,
            { id: item.variant.id },
            'stock',
            item.quantity,
          );
        }
        if (item.product) {
          await manager.decrement(
            Product,
            { id: item.product.id },
            'soldCount',
            item.quantity,
          );
        }
      }
      order.status = OrderStatus.CANCELLED;
      if (order.paymentStatus === PaymentStatus.PAID) {
        order.paymentStatus = PaymentStatus.REFUNDED;
      }
      await manager.save(order);
    });
  }

  private emitOrderCreated(event: OrderCreatedEvent): void {
    this.events.emit(ORDER_CREATED, event);
  }

  private emitStatusChanged(order: Order): void {
    this.events.emit(ORDER_STATUS_CHANGED, {
      orderId: order.id,
      code: order.code,
      status: order.status,
    });
  }

  private generateCode(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `WOWE${ts}${rand}`;
  }
}
