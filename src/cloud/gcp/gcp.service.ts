import { Injectable } from '@nestjs/common';
import { ICloudProvider } from '../interfaces/cloud-provider.interface';
import { ISqsService } from '../interfaces/sqs.interface';
import { IStorageService } from '../interfaces/storage.interface';
import { GcpStorageService } from './services/gcp-storage.service';

@Injectable()
export class GcpService implements ICloudProvider {
  constructor(private gcpStorageService: GcpStorageService) {}

  getStorageService(): IStorageService {
    return this.gcpStorageService;
  }

  getSqsService(): ISqsService {
    return;
  }
}
