import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { numericTransformer } from '../common/transformers/numeric.transformer';
import { Order } from './order.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  product: Product | null;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'SET NULL' })
  variant: ProductVariant | null;

  // Snapshot để giữ nguyên thông tin dù sản phẩm bị sửa/xoá về sau
  @Column()
  productName: string;

  @Column()
  variantInfo: string; // ví dụ "M / Đen"

  @Column({ type: 'varchar', length: 512, nullable: true })
  imageUrl: string | null;

  @Column('decimal', { precision: 12, scale: 2, transformer: numericTransformer })
  price: number; // đơn giá tại thời điểm mua

  @Column()
  quantity: number;
}
