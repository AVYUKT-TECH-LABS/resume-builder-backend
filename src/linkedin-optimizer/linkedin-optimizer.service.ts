import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Upload } from '../schemas/upload.schema';
import { Model } from 'mongoose';
import { OpenAiService } from '../openai/openai.service';

@Injectable()
export class LinkedinOptimizerService {
  constructor(
    private config: ConfigService,
    private openAi: OpenAiService,
    @InjectModel(Upload.name) private uploadModel: Model<Upload>,
  ) {}

  async scan(uploadId: string, userId: string) {
    const uploaded = await this.uploadModel.findOne(
      {
        _id: uploadId,
        userId,
      },
      {
        rawContent: 1,
        userId: 1,
        processedContent: 1,
      },
    );

    if (!uploaded) throw new NotFoundException('File was not found');

    if (uploaded.processedContent) return JSON.parse(uploaded.processedContent);

    const result = await this.openAi.optimizeLinkedIn(uploaded.rawContent);

    await uploaded.updateOne({
      processedContent: JSON.stringify(result),
    });

    return result;
  }
}
