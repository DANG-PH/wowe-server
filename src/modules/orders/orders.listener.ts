import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ORDER_CREATED,
  ORDER_STATUS_CHANGED,
} from '../../common/events/order-events';
import type {
  OrderCreatedEvent,
  OrderStatusChangedEvent,
} from '../../common/events/order-events';
import { OrdersService } from './orders.service';

/**
 * Lắng nghe sự kiện đơn hàng in-process. Thay cho consumer RabbitMQ:
 * đủ dùng cho kiến trúc monolith, không cần message broker riêng.
 */
@Injectable()
export class OrdersListener {
  private readonly logger = new Logger(OrdersListener.name);

  constructor(private readonly orders: OrdersService) {}

  @OnEvent(ORDER_CREATED, { async: true })
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.orders.handleOrderCreated(event);
  }

  @OnEvent(ORDER_STATUS_CHANGED)
  onStatusChanged(event: OrderStatusChangedEvent): void {
    this.logger.log(`Đơn ${event.code} chuyển trạng thái -> ${event.status}`);
  }
}
