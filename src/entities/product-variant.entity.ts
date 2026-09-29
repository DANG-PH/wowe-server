import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { numericTransformer } from '../common/transformers/numeric.transformer';
import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @Column()
  size: string; // S, M, L, XL, Freesize

  @Column()
  color: string; // Đen, Trắng, Be...

  @Column({ unique: true })
  sku: string;

  @Column('decimal', {
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  priceOverride: number | null; // giá riêng cho biến thể (nếu có)

  @Column({ default: 0 })
  stock: number;
}
