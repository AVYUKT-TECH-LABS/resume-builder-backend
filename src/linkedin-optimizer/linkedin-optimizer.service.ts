import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OpenAiService } from '../openai/openai.service';
import { PrismaService } from '../prisma/prisma.service';
import { Upload } from '../schemas/upload.schema';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class LinkedinOptimizerService {
  constructor(
    private config: ConfigService,
    private openAi: OpenAiService,
    @InjectModel(Upload.name) private uploadModel: Model<Upload>,
    private prismaService: PrismaService,
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
    await this.deductCredits(userId, 50);
    await uploaded.updateOne({
      processedContent: JSON.stringify(result),
    });

    return result;
  }

  async hasCredits(userId: string, min: number) {
    try {
      const user = await this.prismaService.user.findFirst({
        where: {
          id: userId,
        },
      });
      const credits = user.credits;
      if (credits && Number(credits) >= min) return true;
      return false;
    } catch (err) {
      throw err;
    }
  }

  async deductCredits(userId: string, amt: number) {
    try {
      const user = await this.prismaService.user.findFirst({
        where: {
          id: userId,
        },
      });

      let currentCredits = user.credits;

      if (typeof currentCredits !== 'number') {
        currentCredits = 0;
      }

      if (Number(currentCredits) < amt) {
        throw new Error('Insufficient credits');
      }

      const newCredits = Number(currentCredits) - amt;

      await this.prismaService.user.update({
        where: {
          id: userId,
        },
        data: {
          credits: newCredits,
        },
      });

      return newCredits;
    } catch (err) {
      throw err;
    }
  }
}
