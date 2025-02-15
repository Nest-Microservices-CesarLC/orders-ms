import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { catchError, firstValueFrom } from 'rxjs';
import { PRODUCT_SERVICE } from 'src/config';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationDto } from './dto/pagination-order.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  constructor(
    @Inject(PRODUCT_SERVICE) private readonly productsClient: ClientProxy,
  ) {
    super();
  }
  private readonly logger = new Logger('Main');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async create(createOrderDto: CreateOrderDto) {
    const ids = createOrderDto.items.map((item) => item.productId);
    //1- Confirm ids of products
    const products: any[] = await firstValueFrom(
      //firstValueFrom is used to consult between microservices
      this.productsClient.send({ cmd: 'validate_products' }, ids).pipe(
        catchError((err) => {
          throw new RpcException(err);
        }),
      ),
    );

    //2- Calculate the amount
    const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
      const price = products.find(
        (product) => product.id == orderItem.productId,
      ).price;

      return acc + price * orderItem.quantity;
    }, 0);

    //3- Calculate the total items
    const totalItems = createOrderDto.items.reduce(
      (acc, orderItem) => acc + orderItem.quantity,
      0,
    );

    //4- Insert the order and order items in the database
    const order = await this.order.create({
      data: {
        totalAmount: totalAmount,
        totalItems: totalItems,
        OrderItem: {
          createMany: {
            data: createOrderDto.items.map((item) => {
              return {
                productId: item.productId,
                quantity: item.quantity,
                price: products.find((prod) => prod.id == item.productId).price,
              };
            }),
          },
        },
      },
      include: {
        OrderItem: {
          select: {
            productId: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => {
        return {
          ...orderItem,
          name: products.find((product) => orderItem.productId == product.id!)!
            .name,
        };
      }),
    };
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
      include: {
        OrderItem: {
          select: {
            productId: true,
            price: true,
            quantity: true,
          },
        },
      },
    });

    const productIds = order?.OrderItem.map((item) => item.productId);

    const products: any[] = await firstValueFrom(
      //firstValueFrom is used to consult between microservices
      this.productsClient.send({ cmd: 'validate_products' }, productIds).pipe(
        catchError((err) => {
          throw new RpcException(err);
        }),
      ),
    );

    if (!order) {
      throw new RpcException({
        message: `The order with id ${id} was not found`,
        status: HttpStatus.NOT_FOUND,
      }); //exceptions microservices
    }

    return {
      ...order,
      OrderItem: order.OrderItem.map((item) => {
        return {
          ...item,
          name: products.find((prod) => prod.id === item.productId).name,
        };
      }),
    };
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
