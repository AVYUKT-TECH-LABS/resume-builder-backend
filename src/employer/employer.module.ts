import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { EmployerController } from './employer.controller';
import { EmployerService } from './employer.service';
import { OpenAIModule } from '../openai/openai.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  JobEmbeddings,
  JobEmbeddingsSchema,
} from '../schemas/job-embeddings.schema';

@Module({
  imports: [
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
