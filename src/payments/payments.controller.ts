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
} from '@nestjs/common';

import { GetUser } from '../decorators/user.decorator';
import { ClerkAuthGuard } from '../guards/clerk.guard';
import { User } from '../interfaces/user.interface';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  private logger: Logger = new Logger(PaymentsController.name);
  constructor(private paymentService: PaymentsService) {}

  @UseGuards(ClerkAuthGuard)
  @Post('/order/create')
  async createOrder(@GetUser() user: User, @Body('plan') plan: string) {
    try {
      const order = await this.paymentService.createOrder(plan, user.id);
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

  @Post('webhook/razorpay')
  async handleRazorpayWebhook(
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const isValid = this.paymentService.validateSignature(payload, signature);
    if (!isValid) throw new BadRequestException('Invalid Signature');
    return this.paymentService.processWebhook(payload);
  }

  @UseGuards(ClerkAuthGuard)
  @Get('status/:orderId')
  getStatus(@Param('orderId') orderId: string) {
    try {
      const status = this.paymentService.getOrderStatus(orderId);
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
