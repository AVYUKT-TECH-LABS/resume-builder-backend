// src/cloud/cloud.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { AwsService } from './aws/aws.service';
import { GcpService } from './gcp/gcp.service';
import { ICloudProvider } from './interfaces/cloud-provider.interface';

@Injectable()
export class CloudService implements ICloudProvider {
  private cloudProvider: ICloudProvider;

  constructor(
    @Inject('CLOUD_PROVIDER') cloudProviderName: string,
    private gcpService: GcpService,
    private awsService: AwsService,
  ) {
    this.cloudProvider =
      cloudProviderName === 'AWS' ? this.awsService : this.gcpService;
  }

  getStorageService() {
    return this.cloudProvider.getStorageService();
  }

  getSqsService() {
    return this.awsService.getSqsService();
  }
}
