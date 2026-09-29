import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsUUID, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ description: 'ID biến thể sản phẩm (size/màu)' })
  @IsUUID()
  variantId: string;

  @ApiProperty({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ minimum: 0, description: '0 để xoá khỏi giỏ' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;
}
