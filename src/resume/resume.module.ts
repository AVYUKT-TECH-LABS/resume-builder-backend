import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Resume, ResumeSchema } from '../schemas/resume.schema';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { Upload, UploadSchema } from '../schemas/upload.schema';
import { CloudModule } from '../cloud/cloud.module';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [
    // MulterModule.register({
    //   dest: './uploads',
    //   // storage: multer.diskStorage({
    //   //   filename: function (req, file, cb) {
    //   //     const uniqueSuffix =
    //   //       Date.now() + '-' + Math.round(Math.random() * 1e9);
    //   //     cb(null, file.fieldname + '-' + uniqueSuffix);
    //   //   },
    //   // }),
    // }),
    CloudModule,
    OpenAIModule,
    MongooseModule.forFeature([{ name: Resume.name, schema: ResumeSchema }]),
    MongooseModule.forFeature([{ name: Upload.name, schema: UploadSchema }]),
  ],
  controllers: [ResumeController],
  providers: [ResumeService],
})
export class ResumeModule {}
