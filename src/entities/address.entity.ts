import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  recipientName: string;

  @Column()
  phone: string;

  @Column()
  line: string; // số nhà, tên đường

  @Column()
  ward: string; // phường/xã

  @Column()
  district: string; // quận/huyện

  @Column()
  province: string; // tỉnh/thành phố

  @Column({ default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
