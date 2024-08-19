import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { IStorageService } from '../../interfaces/storage.interface';

@Injectable()
export class AwsS3Service implements IStorageService {
  private s3: S3;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.s3 = new S3({
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get<string>('AWS_REGION'),
    });
    this.bucket = this.configService.get<string>('AWS_BUCKET_NAME');
  }

  async uploadFile(
    file: Express.Multer.File,
    filename: string,
  ): Promise<string> {
    // Implement S3 upload logic here
    throw new Error('Method not implemented.');
  }

  async deleteFile(filename: string): Promise<void> {
    // Implement S3 delete logic here
    throw new Error('Method not implemented.');
  }

  async getSignedUrl(filename: string): Promise<string> {
    // Implement S3 signed URL generation logic here
    throw new Error('Method not implemented.');
  }
}
