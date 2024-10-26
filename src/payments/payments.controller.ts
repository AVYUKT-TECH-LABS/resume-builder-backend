import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  UseGuards,
  Headers,
  Req,
} from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { RealIp } from 'nestjs-real-ip';
import { CandidateJwtAuthGuard } from '../guards/candidate.auth.guard';
import { Request } from 'express';

@Controller('payments')
export class PaymentsController {
  private logger: Logger = new Logger(PaymentsController.name);
  constructor(private paymentService: PaymentsService) {}

  @UseGuards(CandidateJwtAuthGuard)
  @Post('/order/create')
  async createOrder(
    @Req() req: Request,
    @Body('plan') plan_id: string,
    @RealIp() ip: string,
  ) {
    try {
      if (!ip) {
        this.logger.log(`Failed to determine ip for user ${req.candidate.id}`);
        throw new BadRequestException('Failed to create order');
      }

      const order = await this.paymentService.createOrder(
        plan_id,
        req.candidate.id,
        ip,
      );
      return {
        code: 200,
        message: 'Order created',
        data: order,
      };
    } catch (err) {
      this.logger.error(err);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException({
        code: 500,
        message: 'Internal server error',
      });
    }
  }

  @Get('plans')
  async getPlans(@RealIp() ip: string) {
    return this.paymentService.getPlans(ip);
  }

  @Post('webhook/razorpay')
  async handleRazorpayWebhook(
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const isValid = this.paymentService.validateSignature(payload, signature);
    if (!isValid) throw new BadRequestException('Invalid Signature');
    return this.paymentService.processWebhook(payload);
  }

  @UseGuards(CandidateJwtAuthGuard)
  @Get('status/:orderId')
  getStatus(@Param('orderId') orderId: string, @Req() req: Request) {
    try {
      const status = this.paymentService.getOrderStatus(
        orderId,
        req.candidate.id,
      );
      return status;
    } catch (err) {
      this.logger.error(err);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException({
        code: 500,
        message: 'Internal Server Error',
      });
    }
  }
}
