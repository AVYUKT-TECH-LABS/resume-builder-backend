import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { fromEnv } from '@aws-sdk/credential-providers';
import { Injectable } from '@nestjs/common';
import { ISqsService } from 'src/cloud/interfaces/sqs.interface';

@Injectable()
export class AwsSQSService implements ISqsService {
  private readonly sqs: SQSClient = new SQSClient({
    credentials: fromEnv(),
  });

  async sendMessage(
    queueName: string,
    data: { to: string; subject: string; body: string },
  ): Promise<string> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: `https://sqs.ap-south-1.amazonaws.com/522814711150/${queueName}`,
        MessageBody: JSON.stringify(data),
      });

      const result = await this.sqs.send(command);

      return result.MessageId;
    } catch (error) {
      throw new Error(
        `Failed to send message in queue ${queueName}: ${error.message}`,
      );
    }
  }
}
