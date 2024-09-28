import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ResumeProcessorService } from './resume-processor.service';
import { CreateResumeProcessorDto } from './dto/create-resume-processor.dto';
import { UpdateResumeProcessorDto } from './dto/update-resume-processor.dto';

@Controller('resume-processor')
export class ResumeProcessorController {
  constructor(
    private readonly resumeProcessorService: ResumeProcessorService,
  ) {}

  @Post()
  create(@Body() createResumeProcessorDto: CreateResumeProcessorDto) {
    return this.resumeProcessorService.create(createResumeProcessorDto);
  }

  @Get()
  findAll() {
    return this.resumeProcessorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resumeProcessorService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateResumeProcessorDto: UpdateResumeProcessorDto,
  ) {
    return this.resumeProcessorService.update(+id, updateResumeProcessorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resumeProcessorService.remove(+id);
  }
}
