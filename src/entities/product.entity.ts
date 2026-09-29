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
import { ProductStatus } from '../common/enums/product-status.enum';
import { numericTransformer } from '../common/transformers/numeric.transformer';
import { Brand } from './brand.entity';
import { Category } from './category.entity';
import { ProductImage } from './product-image.entity';
import { ProductVariant } from './product-variant.entity';
import { Review } from './review.entity';

@Entity('products')
@Index(['name'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  material: string | null; // chất liệu

  @Column('decimal', { precision: 12, scale: 2, transformer: numericTransformer })
  price: number; // giá gốc (VND)

  @Column('decimal', {
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  salePrice: number | null; // giá khuyến mãi (VND)

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  category: Category | null;

  @ManyToOne(() => Brand, (brand) => brand.products, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  brand: Brand | null;

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images: ProductImage[];

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants: ProductVariant[];

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @Column({ default: 0 })
  soldCount: number;

  @Column('float', { default: 0 })
  ratingAvg: number;

  @Column({ default: 0 })
  ratingCount: number;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.ACTIVE })
  status: ProductStatus;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ type: 'json', nullable: true })
  tags: string[] | null; // ví dụ: mùa, dịp dùng

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
