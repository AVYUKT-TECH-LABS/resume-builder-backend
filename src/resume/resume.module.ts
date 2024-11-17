import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudModule } from '../cloud/cloud.module';
import { OpenAIModule } from '../openai/openai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { Resume, ResumeSchema } from '../schemas/resume.schema';
import { ResumeSchemaV2, ResumeV2 } from '../schemas/resume.schema.v2';
import { Upload, UploadSchema } from '../schemas/upload.schema';
import { ResumeController } from './resume.controller';
import ResumeControllerV2 from './resume.controller.v2';
import { ResumeService } from './resume.service';
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
        PrismaModule,
        CloudModule,
        OpenAIModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
            }),
            inject: [ConfigService],
        }),
        MongooseModule.forFeature([{ name: Resume.name, schema: ResumeSchema }]),
        MongooseModule.forFeature([
            { name: ResumeV2.name, schema: ResumeSchemaV2 },
        ]),
        MongooseModule.forFeature([{ name: Upload.name, schema: UploadSchema }]),
    ],
    controllers: [ResumeController, ResumeControllerV2],
    providers: [ResumeService, ResumeServiceV2],
    exports: [ResumeService, ResumeServiceV2],
})
export class ResumeModule { }
