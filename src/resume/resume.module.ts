import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Resume, ResumeSchema } from '../schemas/resume.schema';
import { ResumeV2, ResumeSchemaV2 } from '../schemas/resume.schema.v2';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { Upload, UploadSchema } from '../schemas/upload.schema';
import { CloudModule } from '../cloud/cloud.module';
import { OpenAIModule } from '../openai/openai.module';
import ResumeControllerV2 from './resume.controller.v2';
import { ResumeServiceV2 } from './resumev2.service';

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
    MongooseModule.forFeature([
      { name: ResumeV2.name, schema: ResumeSchemaV2 },
    ]),
    MongooseModule.forFeature([{ name: Upload.name, schema: UploadSchema }]),
  ],
  controllers: [ResumeController, ResumeControllerV2],
  providers: [ResumeService, ResumeServiceV2],
})
export class ResumeModule {}
