import { IStorageService } from './storage.interface';

export interface ICloudProvider {
  getStorageService(): IStorageService;
}
