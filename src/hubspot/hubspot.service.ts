// hubspot.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@hubspot/api-client';

@Injectable()
export class HubspotService {
    private readonly hubspotClient: Client;
    private readonly logger = new Logger(HubspotService.name);

    constructor(private configService: ConfigService) {
        const accessToken = this.configService.get<string>('HUBSPOT_API_KEY');
        this.hubspotClient = new Client({ accessToken });
    }

    async createContact(properties: Record<string, any>) {
        try {
            const response = await this.hubspotClient.crm.contacts.basicApi.create({ properties });
            return response;
        } catch (error) {
            this.logger.error('Error creating contact in HubSpot', error);
            throw error;
        }
    }
}
