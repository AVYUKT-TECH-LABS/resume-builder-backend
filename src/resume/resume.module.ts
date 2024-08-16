import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Resume, ResumeSchema } from '../schemas/resume.schema';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';

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
    MongooseModule.forFeature([{ name: Resume.name, schema: ResumeSchema }]),
  ],
  controllers: [ResumeController],
  providers: [ResumeService],
})
export class ResumeModule {}
