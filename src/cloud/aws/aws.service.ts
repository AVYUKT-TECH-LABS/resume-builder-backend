import { Injectable } from '@nestjs/common';
import { ICloudProvider } from '../interfaces/cloud-provider.interface';
import { IStorageService } from '../interfaces/storage.interface';
import { AwsS3Service } from './services/aws-s3.service';

@Injectable()
export class AwsService implements ICloudProvider {
  constructor(private awsS3Service: AwsS3Service) {}

  getStorageService(): IStorageService {
    return this.awsS3Service;
  }
}
