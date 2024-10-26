import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class BatchUploadDTO {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  batchId: string;
}
