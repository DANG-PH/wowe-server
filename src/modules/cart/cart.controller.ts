import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@ApiTags('cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  getCart(@CurrentUser('id') userId: string) {
    return this.cart.getCart(userId);
  }

  @Post('items')
  addItem(@CurrentUser('id') userId: string, @Body() dto: AddToCartDto) {
    return this.cart.addItem(userId, dto);
  }

  @Patch('items/:id')
  updateItem(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.updateItem(userId, id, dto.quantity);
  }

  @Delete('items/:id')
  removeItem(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.cart.removeItem(userId, id);
  }

  @Delete()
  clear(@CurrentUser('id') userId: string) {
    return this.cart.clear(userId);
  }
}
