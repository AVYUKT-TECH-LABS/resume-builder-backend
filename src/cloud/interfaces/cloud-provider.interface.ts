import { ISqsService } from './sqs.interface';
import { IStorageService } from './storage.interface';

export interface ICloudProvider {
  getStorageService(): IStorageService;
  getSqsService(): ISqsService;
}
