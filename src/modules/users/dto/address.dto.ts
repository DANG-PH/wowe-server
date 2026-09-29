import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAddressDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Số nhà, tên đường' })
  @IsString()
  @IsNotEmpty()
  line: string;

  @ApiProperty({ description: 'Phường/Xã' })
  @IsString()
  @IsNotEmpty()
  ward: string;

  @ApiProperty({ description: 'Quận/Huyện' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({ description: 'Tỉnh/Thành phố' })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
