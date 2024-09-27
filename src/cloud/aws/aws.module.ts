import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AwsService } from './aws.service';
import { AwsS3Service } from './services/aws-s3.service';
import { AwsSQSService } from './services/aws-sqs.service';

@Module({
  imports: [ConfigModule],
  providers: [AwsS3Service, AwsService, AwsSQSService],
  exports: [AwsService],
})
export class AwsModule {}
