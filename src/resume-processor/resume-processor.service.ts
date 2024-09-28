import { Injectable } from '@nestjs/common';
import { CreateResumeProcessorDto } from './dto/create-resume-processor.dto';
import { UpdateResumeProcessorDto } from './dto/update-resume-processor.dto';

@Injectable()
export class ResumeProcessorService {
  create(createResumeProcessorDto: CreateResumeProcessorDto) {
    return 'This action adds a new resumeProcessor';
  }

  findAll() {
    return `This action returns all resumeProcessor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} resumeProcessor`;
  }

  update(id: number, updateResumeProcessorDto: UpdateResumeProcessorDto) {
    return `This action updates a #${id} resumeProcessor`;
  }

  remove(id: number) {
    return `This action removes a #${id} resumeProcessor`;
  }
}
