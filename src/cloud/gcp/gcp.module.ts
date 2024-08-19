import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GcpStorageService } from './services/gcp-storage.service';
import { GcpService } from './gcp.service';

@Module({
  imports: [ConfigModule],
  providers: [GcpStorageService, GcpService],
  exports: [GcpService],
})
export class GcpModule {}
