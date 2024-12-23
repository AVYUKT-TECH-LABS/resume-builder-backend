import { Module } from '@nestjs/common';
import { ResumeProcessorService } from './resume-processor.service';
import { ResumeProcessorController } from './resume-processor.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ResumeProcessorController],
  providers: [ResumeProcessorService],
})
export class ResumeProcessorModule {}
