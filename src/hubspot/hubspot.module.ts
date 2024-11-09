import { Module } from '@nestjs/common';
import { HubspotService } from './hubspot.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    providers: [HubspotService],
    exports: [HubspotService],
})
export class HubspotModule { }
