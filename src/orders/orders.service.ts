import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationDto } from './dto/pagination-order.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('Main');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async create(createOrderDto: CreateOrderDto) {
    const { totalAmount, totalItems, status, paid } = createOrderDto;
    const newOrder = await this.order.create({
      data: {
        totalAmount,
        totalItems,
        status,
        paid,
      },
    });

    if (!newOrder) {
      throw new RpcException({
        message: `There was an error, consult to IT deparment`,
        status: HttpStatus.CONFLICT,
      }); //exeptions microservices
    }
    return newOrder;
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit, status } = paginationDto;

    const totalPages = await this.order.count();
    const lastPage = Math.ceil(totalPages / limit!);

    return {
      data: await this.order.findMany({
        skip: (page! - 1) * limit!,
        take: limit,
        where: {
          status,
        },
      }),
      meta: {
        page,
        total: totalPages,
        lastPage,
      },
    };
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({
      where: { id },
    });

    if (!order) {
      throw new RpcException({
        message: `The order with id ${id} was not found`,
        status: HttpStatus.NOT_FOUND,
      }); //exeptions microservices
    }

    return order;
  }

  async changeOrderStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;

    await this.findOne(id);
    // //
    return await this.order.update({
      data: { status },
      where: { id },
    });
  }
}
