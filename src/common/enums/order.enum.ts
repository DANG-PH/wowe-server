export enum OrderStatus {
  PENDING = 'pending', // chờ xác nhận
  CONFIRMED = 'confirmed', // đã xác nhận
  PROCESSING = 'processing', // đang chuẩn bị hàng
  SHIPPING = 'shipping', // đang giao
  DELIVERED = 'delivered', // đã giao
  CANCELLED = 'cancelled', // đã huỷ
}

export enum PaymentMethod {
  COD = 'cod', // thanh toán khi nhận hàng
  BANK_TRANSFER = 'bank_transfer', // chuyển khoản
  MOMO = 'momo', // ví MoMo
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  REFUNDED = 'refunded',
}
