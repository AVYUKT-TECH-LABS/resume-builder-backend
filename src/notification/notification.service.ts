import { Injectable } from '@nestjs/common';
import { CloudService } from 'src/cloud/cloud.service';

@Injectable()
export class NotificationService {
  constructor(private cloud: CloudService) {}

  async sendMail(
    queueName: string,
    data: { to: string; subject: string; body: string },
  ) {
    const sqs = this.cloud.getSqsService();

    const result = await sqs.sendMessage(queueName, data);

    return result;
  }
}
