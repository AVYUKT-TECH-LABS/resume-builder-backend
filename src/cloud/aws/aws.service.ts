import { Injectable } from '@nestjs/common';
import { ICloudProvider } from '../interfaces/cloud-provider.interface';
import { ISqsService } from '../interfaces/sqs.interface';
import { IStorageService } from '../interfaces/storage.interface';
import { AwsS3Service } from './services/aws-s3.service';
import { AwsSQSService } from './services/aws-sqs.service';

@Injectable()
export class AwsService implements ICloudProvider {
  constructor(
    private awsS3Service: AwsS3Service,
    private awsSqsService: AwsSQSService,
  ) {}

  getStorageService(): IStorageService {
    return this.awsS3Service;
  }

  getSqsService(): ISqsService {
    return this.awsSqsService;
  }
}
