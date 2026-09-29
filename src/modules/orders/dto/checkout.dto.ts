import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '../../../common/enums/order.enum';

export class CheckoutDto {
  @ApiProperty({ example: 'Nguyễn Thị An' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '25 Lê Lợi' })
  @IsString()
  @IsNotEmpty()
  line: string;

  @ApiProperty({ example: 'Phường Bến Nghé' })
  @IsString()
  @IsNotEmpty()
  ward: string;

  @ApiProperty({ example: 'Quận 1' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({ example: 'TP. Hồ Chí Minh' })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.COD })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: 'WOWE10' })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
