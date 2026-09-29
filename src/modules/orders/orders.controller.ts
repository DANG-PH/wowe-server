import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { OrderStatus } from '../../common/enums/order.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post('checkout')
  checkout(@CurrentUser('id') userId: string, @Body() dto: CheckoutDto) {
    return this.orders.checkout(userId, dto);
  }

  @Get()
  myOrders(
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.orders.findMyOrders(userId, pagination);
  }

  @Roles(UserRole.ADMIN)
  @ApiQuery({ name: 'status', enum: OrderStatus, required: false })
  @Get('admin/all')
  adminAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: OrderStatus,
  ) {
    return this.orders.adminFindAll(pagination, status);
  }

  @Get(':code')
  findOne(@CurrentUser() user: JwtUser, @Param('code') code: string) {
    return this.orders.findByCode(
      user.id,
      code,
      user.role === UserRole.ADMIN,
    );
  }

  @Post(':code/cancel')
  cancel(@CurrentUser('id') userId: string, @Param('code') code: string) {
    return this.orders.cancel(userId, code);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/:code/status')
  updateStatus(
    @Param('code') code: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.adminUpdateStatus(code, dto.status);
  }
}
