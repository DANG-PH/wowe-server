import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiscountType } from '../../common/enums/coupon.enum';
import { Coupon } from '../../entities/coupon.entity';
import { CreateCouponDto } from './dto/coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon) private readonly coupons: Repository<Coupon>,
  ) {}

  findAll(): Promise<Coupon[]> {
    return this.coupons.find({ order: { createdAt: 'DESC' } });
  }

  create(dto: CreateCouponDto): Promise<Coupon> {
    const coupon = this.coupons.create({
      code: dto.code.trim().toUpperCase(),
      type: dto.type,
      value: dto.value,
      minOrder: dto.minOrder ?? 0,
      maxDiscount: dto.maxDiscount ?? null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      usageLimit: dto.usageLimit ?? 0,
    });
    return this.coupons.save(coupon);
  }

  async remove(id: string): Promise<void> {
    const result = await this.coupons.delete(id);
    if (!result.affected) throw new NotFoundException('Không tìm thấy mã');
  }

  /** Kiểm tra mã và tính số tiền được giảm. Ném lỗi nếu không hợp lệ. */
  async validateAndCompute(
    code: string,
    subtotal: number,
  ): Promise<{ coupon: Coupon; discount: number }> {
    const coupon = await this.coupons.findOne({
      where: { code: code.trim().toUpperCase() },
    });
    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Mã giảm giá không tồn tại');
    }
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Mã giảm giá đã hết hạn');
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    }
    if (subtotal < coupon.minOrder) {
      throw new BadRequestException(
        `Đơn tối thiểu ${coupon.minOrder.toLocaleString('vi-VN')}đ để dùng mã này`,
      );
    }

    let discount =
      coupon.type === DiscountType.PERCENT
        ? (subtotal * coupon.value) / 100
        : coupon.value;
    if (coupon.type === DiscountType.PERCENT && coupon.maxDiscount) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
    discount = Math.min(Math.round(discount), subtotal);
    return { coupon, discount };
  }

  async markUsed(id: string): Promise<void> {
    await this.coupons.increment({ id }, 'usedCount', 1);
  }
}
