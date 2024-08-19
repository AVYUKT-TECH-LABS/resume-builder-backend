import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resume } from '../schemas/resume.schema';
import { Resume as ResumeType } from '../types/index';
import { UpdateResumeDto } from './dto/update-resume.dto';

@Injectable()
export class ResumeService {
  constructor(@InjectModel(Resume.name) private resumeModel: Model<Resume>) {}
  create(userId: string) {
    const createdResume = new this.resumeModel({
      userId,
      name: '',
      page: {
        size: 'A4',
        background: null,
        margins: 10,
        spacing: 1,
      },
      template: 'ivy',
      font: '',
      color: '#000',
      resume: {
        id: 'resume-id',
        contact: {
          settings: [
            {
              key: 'showTitle',
              name: 'Show Title',
              value: true,
            },
            {
              key: 'showPhone',
              name: 'Show Phone',
              value: true,
            },
            {
              key: 'showLink',
              name: 'Show Link',
              value: true,
            },
            {
              key: 'showEmail',
              name: 'Show Email',
              value: true,
            },
            {
              key: 'showLocation',
              name: 'Show Location',
              value: true,
            },
          ],
          data: {
            name: '',
            title: '',
            phone: '',
            link: '',
            email: '',
            location: '',
          },
        },
        sections: [],
      },
    });
    return createdResume.save();
  }

  findAll(userId: string) {
    return this.resumeModel
      .find(
        { userId },
        {
          createdAt: 1,
          updatedAt: 1,
          resume: 1,
          name: 1,
          _id: 1,
        },
      )
      .exec();
  }

  findOne(_id: string, userId: string) {
    return this.resumeModel
      .findOne({
        _id,
        userId,
      })
      .exec();
  }

  async update(id: string, updateResumeDto: UpdateResumeDto, user_id: string) {
    return await this.resumeModel
      .updateOne(
        {
          _id: id,
          userId: user_id,
        },
        updateResumeDto,
      )
      .exec();

    // return 'ok';
  }

  remove(id: string) {
    return this.resumeModel.deleteOne({ _id: id }).exec();
  }

  async createFromData(userId: string, resumeData: ResumeType, name: string) {
    return this.resumeModel.create({
      userId,
      name,
      page: {
        background: null,
        margins: 1,
        size: 'A4',
        spacing: 12,
      },
      template: 'ivy',
      font: '',
      color: '#000',
      resume: {
        id: '',
        contact: {
          settings: [
            {
              key: 'showTitle',
              name: 'Show Title',
              value: true,
            },
            {
              key: 'showPhone',
              name: 'Show Phone',
              value: true,
            },
            {
              key: 'showLink',
              name: 'Show Link',
              value: true,
            },
            {
              key: 'showEmail',
              name: 'Show Email',
              value: true,
            },
            {
              key: 'showLocation',
              name: 'Show Location',
              value: true,
            },
          ],
          data: resumeData.contact.data,
        },
        sections: resumeData.sections,
      },
    });
  }
}
