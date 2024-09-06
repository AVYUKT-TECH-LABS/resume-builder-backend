import { Module } from '@nestjs/common';
import { LinkedinOptimizerService } from './linkedin-optimizer.service';
import { LinkedinOptimizerController } from './linkedin-optimizer.controller';
import { OpenAIModule } from '../openai/openai.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Upload, UploadSchema } from '../schemas/upload.schema';

@Module({
  imports: [
    OpenAIModule,
    ConfigModule,
    MongooseModule.forFeature([{ name: Upload.name, schema: UploadSchema }]),
  ],
  controllers: [LinkedinOptimizerController],
  providers: [LinkedinOptimizerService],
})
export class LinkedinOptimizerModule {}
