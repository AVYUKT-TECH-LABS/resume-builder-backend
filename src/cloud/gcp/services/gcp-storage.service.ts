import { Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageService } from '../../interfaces/storage.interface';

@Injectable()
export class GcpStorageService implements IStorageService {
  private storage: Storage;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.storage = new Storage({
      projectId: this.configService.get<string>('GCP_PROJECT_ID'),
      keyFilename: this.configService.get<string>('GCP_KEY_FILE'),
    });
    this.bucket = this.configService.get<string>('STORAGE_BUCKET');
  }

  async uploadFile(
    file: Express.Multer.File,
    filename: string,
  ): Promise<string> {
    const bucket = this.storage.bucket(this.bucket);
    const blob = bucket.file(filename);
    const blobStream = blob.createWriteStream();

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => reject(err));
      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${this.bucket}/${filename}`;
        resolve(publicUrl);
      });
      blobStream.end(file.buffer);
    });
  }

  async deleteFile(filename: string): Promise<void> {
    await this.storage.bucket(this.bucket).file(filename).delete();
  }

  async getSignedUrl(filename: string): Promise<string> {
    const [url] = await this.storage
      .bucket(this.bucket)
      .file(filename)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        responseDisposition: 'inline',
      });
    return url;
  }
}
