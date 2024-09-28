import { Module } from '@nestjs/common';
import { MigrationsController } from './migrations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ResumeSchemaV2, ResumeV2 } from '../schemas/resume.schema.v2';

@Module({
  imports: [
    PrismaModule,
    MongooseModule.forFeature([
      { name: ResumeV2.name, schema: ResumeSchemaV2 },
    ]),
  ],
  controllers: [MigrationsController],
})
export class MigrationsModule {}
