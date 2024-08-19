export interface IStorageService {
  uploadFile(file: Express.Multer.File, filename: string): Promise<string>;
  deleteFile(filename: string): Promise<void>;
  getSignedUrl(filename: string): Promise<string>;
}
