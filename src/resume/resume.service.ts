import { Injectable } from '@nestjs/common';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { Resume } from '../schemas/resume.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ResumeService {
  constructor(@InjectModel(Resume.name) private resumeModel: Model<Resume>) {}
  create(createResumeDto: CreateResumeDto, userId: string) {
    const createdResume = new this.resumeModel({ ...createResumeDto, userId });
    return createdResume.save();
  }

  findAll(userId: string) {
    return this.resumeModel
      .find(
        { userId },
        {
          createdAt: 1,
          updatedAt: 1,
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

  update(id: number, updateResumeDto: UpdateResumeDto) {
    return `This action updates a #${id} resume`;
  }

  remove(id: number) {
    return this.resumeModel.deleteOne({ _id: id }).exec();
  }
}
