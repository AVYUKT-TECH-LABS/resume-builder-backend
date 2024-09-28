import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { IpInfoService } from '../ip-info/ipinfo.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;
  constructor(
    private configService: ConfigService,
    private ipInfo: IpInfoService,
    private prisma: PrismaService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RZP_KEY_ID'),
      key_secret: this.configService.get<string>('RZP_KEY_SECRET'),
    });
  }

  async getPlans(ipAddr: string) {
    const plans = await this.prisma.plan.findMany({
      where: {
        isActive: true,
      },
    });

    const regionalPlans = await Promise.all(
      plans.map(async (plan) => {
        const details = await this.ipInfo.getRegionalPricing(
          plan.amount / 100,
          'INR',
          ipAddr,
        );
        return {
          ...plan,
          amount: details.adjustedPrice,
          display_amount: `${details.currency.symbol}${details.adjustedPrice / Math.pow(10, details.exponent)}`,
        };
      }),
    );

    return regionalPlans;
  }

  async createOrder(planName: string, userId: string, ip: string) {
    const [plan, user] = await Promise.all([
      this.getPlan(planName),
      this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      }),
    ]);

    if (!user)
      throw new BadRequestException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });

    if (!plan)
      throw new BadRequestException({
        code: 'PLAN_NOT_FOUND',
        message: 'Plan not found',
      });

    //Get amount and currency based on location
    const adjustedOrderDetails = await this.ipInfo.getRegionalPricing(
      plan.amount / 100,
      'INR',
      ip,
    );

    const rzpOrder = await this.razorpay.orders.create({
      amount: adjustedOrderDetails.adjustedPrice,
      currency: adjustedOrderDetails.currency.code,
      notes: {
        env: this.configService.get<string>('NODE_ENV'),
      },
      customer_details: {
        name: user.name,
        email: user.email,
        contact: null,
        shipping_address: null,
        billing_address: null,
      },
    });

    if ('error' in rzpOrder)
      throw new BadRequestException({
        code: 'ORDER_FAILED',
        message: 'Failed to create order',
      });

    await this.saveOrder({
      orderId: rzpOrder.id,
      userId,
      planId: plan.id,
      pg: 'RAZORPAY',
      amount: plan.amount,
      currency: 'INR',
      status: rzpOrder.status,
    });

    return rzpOrder;
  }

  private async saveOrder({
    orderId,
    userId,
    planId,
    pg,
    amount,
    currency,
    status,
  }) {
    return this.prisma.order.create({
      data: {
        planId,
        pg_orderId: orderId,
        pg,
        amount,
        currency,
        status,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }

  async getPlan(planName: string) {
    return this.prisma.plan.findFirst({
      where: {
        name: planName,
      },
    });
  }

  async getOrderStatus(orderId: string) {
    return this.prisma.order.findUnique({
      where: {
        pg_orderId: orderId,
      },
      select: {
        status: true,
      },
    });
  }

  validateSignature(payload, signature) {
    const isDev = this.configService.get('NODE_ENV');
    if (isDev) return true;

    const secret = this.configService.get<string>('RZP_KEY_SECRET');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== expectedSignature) return false;

    return true;
  }

  async processWebhook(payload: Record<string, any>): Promise<string> {
    const { event, payload: eventPayload } = payload;

    if (event !== 'order.paid') {
      return 'IGNORED';
    }

    const order = eventPayload.order.entity;

    if (order.notes.env !== this.configService.get('NODE_ENV')) {
      return 'ENV_MISMATCH';
    }

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const existingOrder = await prisma.order.findUnique({
          where: { pg_orderId: order.id },
        });

        if (!existingOrder) {
          return 'ORDER_NOT_FOUND';
        }

        const updatedOrder = await prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            status: 'PAID',
            amount: (order.amount / 100).toString(),
            currency: order.currency,
          },
        });

        const plan = await prisma.plan.findFirst({
          where: {
            id: updatedOrder.planId,
            isActive: true,
            amount: order.amount,
          },
          select: { credits: true },
        });

        if (!plan) {
          return 'PLAN_NOT_FOUND';
        }

        const user = await this.prisma.user.findUnique({
          where: {
            id: updatedOrder.userId,
          },
        });
        const updatedCredits = Number(user.credits || 0) + plan.credits;

        await this.prisma.user.update({
          where: {
            id: updatedOrder.userId,
          },
          data: {
            credits: updatedCredits,
          },
        });

        return 'SUCCESS';
      });

      return result;
    } catch (error) {
      console.error('Webhook processing error:', error);
      return 'ERROR';
    }
  }
}
