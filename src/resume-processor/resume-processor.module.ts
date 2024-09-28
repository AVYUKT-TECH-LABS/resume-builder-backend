import { Module } from '@nestjs/common';
import { ResumeProcessorService } from './resume-processor.service';
import { ResumeProcessorController } from './resume-processor.controller';

@Module({
  controllers: [ResumeProcessorController],
  providers: [ResumeProcessorService],
})
export class ResumeProcessorModule {}
