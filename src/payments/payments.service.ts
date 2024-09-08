import { clerkClient } from '@clerk/clerk-sdk-node';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import Razorpay from 'razorpay';
import { Plan } from '../schemas/plan.schema';
import { Model } from 'mongoose';
import { Order } from '../schemas/order.schema';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;
  constructor(
    private configService: ConfigService,
    @InjectModel(Plan.name) private planModel: Model<Plan>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RZP_KEY_ID'),
      key_secret: this.configService.get<string>('RZP_KEY_SECRET'),
    });
  }

  async createOrder(planName: string, userId: string) {
    const [plan, user] = await Promise.all([
      this.getPlan(planName),
      clerkClient.users.getUser(userId),
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

    const rzpOrder = await this.razorpay.orders.create({
      amount: plan.amount,
      currency: 'INR',
      notes: {
        env: this.configService.get<string>('NODE_ENV'),
      },
      customer_details: {
        name: user.fullName,
        email: user.emailAddresses[0]?.emailAddress,
        contact: user.phoneNumbers[0]?.phoneNumber,
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
    return this.orderModel.create({
      userId,
      planId,
      pg_orderId: orderId,
      pg,
      amount,
      currency,
      status,
    });
  }

  async getPlan(planName: string) {
    return this.planModel.findOne({
      name: planName,
    });
  }

  async getOrderStatus(orderId: string) {
    return this.orderModel.findOne(
      {
        pg_orderId: orderId,
      },
      {
        status: 1,
      },
    );
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

    const session = await this.orderModel.startSession();
    session.startTransaction();

    try {
      const existingOrder = await this.orderModel
        .findOne({ pg_orderId: order.id })
        .session(session);

      if (!existingOrder) {
        return 'ORDER_NOT_FOUND';
      }

      existingOrder.status = order.status;
      existingOrder.amount = (order.amount / 100).toString();
      existingOrder.currency = order.currency;
      existingOrder.status = 'PAID';

      const { planId, userId } = existingOrder;

      const plan = await this.planModel
        .findOne(
          {
            _id: planId,
            isActive: true,
            amount: order.amount,
          },
          { credits: 1 },
        )
        .session(session);

      if (!plan) {
        return 'PLAN_NOT_FOUND';
      }
      const user = await clerkClient.users.getUser(userId);
      const updatedCredits =
        Number(user.publicMetadata.credits || 0) + plan.credits;

      await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: { credits: updatedCredits },
      });

      await existingOrder.save({ session });
      await session.commitTransaction();

      return 'SUCCESS';
    } catch (error) {
      await session.abortTransaction();
      console.error('Webhook processing error:', error);
      return 'SUCCESS';
    } finally {
      session.endSession();
    }
  }
}
