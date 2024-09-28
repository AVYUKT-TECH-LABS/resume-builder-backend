import { PartialType } from '@nestjs/swagger';
import { CreateResumeProcessorDto } from './create-resume-processor.dto';

export class UpdateResumeProcessorDto extends PartialType(CreateResumeProcessorDto) {}
