import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  JobApplications,
  JobApplicationsSchema,
} from 'src/schemas/job-application.schema';
import { Job, JobSchema } from 'src/schemas/job.schema';
import { JobPortalController } from './job-portal.controller';
import { JobPortalService } from './job-portal.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]),
    MongooseModule.forFeature([
      { name: JobApplications.name, schema: JobApplicationsSchema },
    ]),
  ],
  controllers: [JobPortalController],
  providers: [JobPortalService],
})
export class JobPortalModule {}
