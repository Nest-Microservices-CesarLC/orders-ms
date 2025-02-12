import { OrderStatus } from '@prisma/client';
import { IsEnum, IsString, IsUUID } from 'class-validator';
import { OrderStatusList } from '../enum/order.enum';

export class ChangeOrderStatusDto {
  @IsString()
  @IsUUID()
  id: string;

  @IsEnum(OrderStatusList, {
    message: `Valid statuses are ${OrderStatusList}`,
  })
  @IsString()
  status: OrderStatus;
}
