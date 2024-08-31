import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResumeV2 } from '../schemas/resume.schema.v2';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { CreateResumeDTO, UpdateResumeDTO } from './dto/resumev2.dto';
import { deductCredits } from '../utils/credits';

@Injectable()
export class ResumeServiceV2 {
  constructor(
    @InjectModel(ResumeV2.name) private resumeModel: Model<ResumeV2>,
    private config: ConfigService,
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
}
