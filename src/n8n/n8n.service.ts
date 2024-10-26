import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class N8nService {
  private logger: Logger = new Logger(N8nService.name);
  constructor(private config: ConfigService) {}

  async sendEvent(
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.callWebhook({
      event,
      payload,
    });
  }

  async callWebhook(data: Record<string, unknown>): Promise<void> {
    try {
      const endpoint =
        'https://avyuktlabs.app.n8n.cloud/webhook-test/532feefd-5beb-4f1c-8cbe-3ea2053d733e'; //this.config.get<string>('N8N_ENDPOINT');
      await axios.post(endpoint, data);
    } catch (err) {
      this.logger.log(err);
    }
  }
}
