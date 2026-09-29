import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../common/enums/order.enum';
import { numericTransformer } from '../common/transformers/numeric.transformer';
import { OrderItem } from './order-item.entity';
import { User } from './user.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  code: string; // mã đơn: WOWE + số

  @ManyToOne(() => User, (user) => user.orders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  user: User | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Column('decimal', { precision: 12, scale: 2, transformer: numericTransformer })
  subtotal: number;

  @Column('decimal', {
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  shippingFee: number;

  @Column('decimal', {
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  discount: number;

  @Column('decimal', { precision: 12, scale: 2, transformer: numericTransformer })
  total: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.COD })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  // Snapshot thông tin giao hàng tại thời điểm đặt
  @Column()
  recipientName: string;

  @Column()
  phone: string;

  @Column({ type: 'text' })
  shippingAddress: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  couponCode: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
