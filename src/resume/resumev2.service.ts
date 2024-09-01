import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResumeV2 } from '../schemas/resume.schema.v2';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { CreateResumeDTO, UpdateResumeDTO } from './dto/resumev2.dto';
import { deductCredits } from '../utils/credits';
import { Upload } from '../schemas/upload.schema';
import { OpenAiService } from '../openai/openai.service';

@Injectable()
export class ResumeServiceV2 {
  constructor(
    @InjectModel(ResumeV2.name) private resumeModel: Model<ResumeV2>,
    @InjectModel(Upload.name) private uploadModel: Model<Upload>,
    private config: ConfigService,
    private openai: OpenAiService,
  ) {}

  async get(resumeId: string, userId: string) {
    try {
      const resume = await this.resumeModel.findOne({
        _id: resumeId,
        userId,
      });

      if (!resume) throw new NotFoundException('Resume not found');

      return resume;
    } catch (err) {
      throw err;
    }
  }

  async getAll(userId: string) {
    try {
      const resumes = await this.resumeModel.find(
        {
          userId,
        },
        {
          'pageConfig.colors.primary': 1,
          'sections.personalInformation.title': 1,
          createdAt: 1,
          updatedAt: 1,
        },
      );

      if (!resumes) throw new NotFoundException('Resumes not found');

      return resumes;
    } catch (err) {
      throw err;
    }
  }

  async create(
    data: CreateResumeDTO,
    userId: string,
  ): Promise<
    ResumeV2 & {
      _id: Types.ObjectId;
    }
  > {
    try {
      const newResume = await this.resumeModel.create({
        userId,
        ...data,
      });

      if (newResume) await deductCredits(userId, 30);

      return newResume;
    } catch (err) {
      throw 'Failed to create resume';
    }
  }

  async save(
    resumeId: string,
    data: UpdateResumeDTO,
    userId: string,
  ): Promise<ResumeV2> {
    try {
      const resume = await this.resumeModel.findOne({ _id: resumeId, userId });

      if (!resume) {
        throw new NotFoundException(
          'Resume not found or does not belong to the user',
        );
      }

      Object.assign(resume, data);
      await resume.save();

      return resume;
    } catch (error) {
      throw error;
    }
  }

  async delete(resumeId: string, userId: string) {
    try {
      const resume = await this.resumeModel.findOne({ _id: resumeId, userId });

      if (!resume) {
        throw new NotFoundException(
          'Resume not found or does not belong to the user',
        );
      }

      await resume.deleteOne();

      return;
    } catch (error) {
      throw error;
    }
  }

  async generateDomainSpecific(upload_id: string, domains: string[]) {
    const uploaded = await this.uploadModel.findById(upload_id, {
      rawContent: 1,
      userId: 1,
    });

    const defaults = {
      pageConfig: {
        size: 'A4',
        background: null,
        margin: 6,
        spacing: 0,
        font: {
          fontFamily:
            '__Playfair_Display_e3a538, __Playfair_Display_Fallback_e3a538',
          fontStyle: 'normal',
        },
        fontSizes: {
          heading: 0,
          subHeading: 0,
          content: 16,
          lineHeight: 1.7,
        },
        colors: {
          primary: '#296d98',
          background: '#ffffff',
          text: '#000000',
        },
        template: 'clarity',
      },
      picture: {
        available: false,
        enabled: true,
        url: 'https://st3.depositphotos.com/9998432/13335/v/450/depositphotos_133352010-stock-illustration-default-placeholder-man-and-woman.jpg',
        size: 120,
        radius: 20,
        border: false,
        grayscale: false,
      },
    };

    const promises = domains.map(async (domain) => {
      const resume = await this.openai.resumeForDomain(
        uploaded.rawContent,
        domain,
        'v2',
      );

      const created = await this.create(
        { ...defaults, ...resume },
        uploaded.userId,
      );
      return created;
    });

    await Promise.all(promises);
    return 'ok';
  }
}
