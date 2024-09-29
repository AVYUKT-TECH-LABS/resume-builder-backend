import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudModule } from '../cloud/cloud.module';
import { OpenAIModule } from '../openai/openai.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  JobEmbeddings,
  JobEmbeddingsSchema,
} from '../schemas/job-embeddings.schema';
import { EmployerController } from './employer.controller';
import { EmployerService } from './employer.service';

@Module({
  imports: [
    CloudModule,
    PrismaModule,
    OpenAIModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: JobEmbeddings.name, schema: JobEmbeddingsSchema },
    ]),
  ],
  controllers: [EmployerController],
  providers: [EmployerService],
  exports: [EmployerService],
})
export class EmployerModule {}
