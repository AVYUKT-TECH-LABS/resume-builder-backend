import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GcpModule } from './gcp/gcp.module';
import { AwsModule } from './aws/aws.module';
import { CloudService } from './cloud.service';

@Module({
  imports: [ConfigModule, GcpModule, AwsModule],
  providers: [
    {
      provide: 'CLOUD_PROVIDER',
      useFactory: (configService: ConfigService) => {
        return configService.get<string>('CLOUD_PROVIDER', 'GCP');
      },
      inject: [ConfigService],
    },
    CloudService,
  ],
  exports: [CloudService],
})
export class CloudModule {}
