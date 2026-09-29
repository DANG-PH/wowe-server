import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Address } from '../../entities/address.entity';
import { User } from '../../entities/user.entity';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Address) private readonly addresses: Repository<Address>,
  ) {}

  async create(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }): Promise<User> {
    const existing = await this.users.findOne({
      where: { email: data.email },
    });
    if (existing) throw new ConflictException('Email đã được sử dụng');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = this.users.create({
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      phone: data.phone ?? null,
    });
    return this.users.save(user);
  }

  findByEmail(email: string, withPassword = false): Promise<User | null> {
    const qb = this.users
      .createQueryBuilder('u')
      .where('u.email = :email', { email });
    if (withPassword) qb.addSelect('u.passwordHash');
    return qb.getOne();
  }

  async findById(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, dto);
    return this.users.save(user);
  }

  // ===== Địa chỉ giao hàng =====

  listAddresses(userId: string): Promise<Address[]> {
    return this.addresses.find({
      where: { user: { id: userId } },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async addAddress(userId: string, dto: CreateAddressDto): Promise<Address> {
    if (dto.isDefault) await this.clearDefault(userId);
    const address = this.addresses.create({
      ...dto,
      user: { id: userId } as User,
    });
    return this.addresses.save(address);
  }

  async updateAddress(
    userId: string,
    id: string,
    dto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.getOwnedAddress(userId, id);
    if (dto.isDefault) await this.clearDefault(userId);
    Object.assign(address, dto);
    return this.addresses.save(address);
  }

  async removeAddress(userId: string, id: string): Promise<void> {
    const address = await this.getOwnedAddress(userId, id);
    await this.addresses.remove(address);
  }

  private async getOwnedAddress(
    userId: string,
    id: string,
  ): Promise<Address> {
    const address = await this.addresses.findOne({
      where: { id, user: { id: userId } },
    });
    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ');
    return address;
  }

  private async clearDefault(userId: string): Promise<void> {
    await this.addresses.update(
      { user: { id: userId }, isDefault: true },
      { isDefault: false },
    );
  }
}
