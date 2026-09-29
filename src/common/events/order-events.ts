/** Sự kiện nội bộ (in-process) cho đơn hàng, phát qua @nestjs/event-emitter. */
export const ORDER_CREATED = 'order.created';
export const ORDER_STATUS_CHANGED = 'order.status_changed';

export interface OrderCreatedEvent {
  orderId: string;
  code: string;
  total: number;
  email: string | null;
}

export interface OrderStatusChangedEvent {
  orderId: string;
  code: string;
  status: string;
}
