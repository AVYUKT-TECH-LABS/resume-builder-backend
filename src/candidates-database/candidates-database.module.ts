import { Module } from '@nestjs/common';
import { CandidatesDatabaseController } from './candidates-database.controller';
import { CandidatesDatabaseService } from './candidates-database.service';
import { OpenAIModule } from '../openai/openai.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ResumeSchemaV2, ResumeV2 } from '../schemas/resume.schema.v2';
import { PrismaModule } from '../prisma/prisma.module';
import {
  JobEmbeddings,
  JobEmbeddingsSchema,
} from '../schemas/job-embeddings.schema';

@Module({
  imports: [
    PrismaModule,
    OpenAIModule,
    MongooseModule.forFeature([
      { name: ResumeV2.name, schema: ResumeSchemaV2 },
    ]),
    MongooseModule.forFeature([
      { name: JobEmbeddings.name, schema: JobEmbeddingsSchema },
    ]),
  ],
  controllers: [CandidatesDatabaseController],
  providers: [CandidatesDatabaseService],
})
export class CandidatesDatabaseModule {}
