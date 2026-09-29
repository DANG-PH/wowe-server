import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DiscountType } from '../common/enums/coupon.enum';
import { numericTransformer } from '../common/transformers/numeric.transformer';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: DiscountType })
  type: DiscountType;

  @Column('decimal', { precision: 12, scale: 2, transformer: numericTransformer })
  value: number; // % hoặc số tiền tuỳ type

  @Column('decimal', {
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  minOrder: number; // giá trị đơn tối thiểu để áp dụng

  @Column('decimal', {
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  maxDiscount: number | null; // trần giảm giá (cho loại percent)

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @Column({ default: 0 })
  usageLimit: number; // 0 = không giới hạn

  @Column({ default: 0 })
  usedCount: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
