import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenAIModule } from '../openai/openai.module';
import { Upload, UploadSchema } from '../schemas/upload.schema';
import { LinkedinOptimizerController } from './linkedin-optimizer.controller';
import { LinkedinOptimizerService } from './linkedin-optimizer.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    OpenAIModule,
    ConfigModule,
    MongooseModule.forFeature([{ name: Upload.name, schema: UploadSchema }]),
  ],
  controllers: [LinkedinOptimizerController],
  providers: [LinkedinOptimizerService],
})
export class LinkedinOptimizerModule {}
