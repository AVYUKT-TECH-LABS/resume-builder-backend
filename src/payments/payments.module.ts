import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaModule } from '../prisma/prisma.module';
import { IpInfoModule } from '../ip-info/ip-info.module';
import { Order, OrderSchema } from '../schemas/order.schema';
import { Plan, PlanSchema } from '../schemas/plan.schema';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    MongooseModule.forFeature([{ name: Plan.name, schema: PlanSchema }]),
    IpInfoModule,
    PrismaModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
