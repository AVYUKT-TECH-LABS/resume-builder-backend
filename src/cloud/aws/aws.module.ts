import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AwsS3Service } from './services/aws-s3.service';
import { AwsService } from './aws.service';

@Module({
  imports: [ConfigModule],
  providers: [AwsS3Service, AwsService],
  exports: [AwsService],
})
export class AwsModule {}
