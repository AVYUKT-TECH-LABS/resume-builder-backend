import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type JobApplicationsDocument = HydratedDocument<JobApplications>;

@Schema({ timestamps: true })
export class JobApplications {
  @Prop({ required: true })
  job_id: string;

  @Prop({ required: true })
  user_id: string;

  @Prop({
    required: true,
    enum: [
      'application_recieved',
      'under_review',
      'shortlisted',
      'assessment_scheduled',
      'interview_scheduled',
      'interview_in_progress',
      'interview_completed',
      'offer_made',
      'offer_accepted',
      'offer_rejected',
      'hired',
      'rejected',
      'on_hold',
    ],
  })
  application_status: string;

  @Prop({ required: true })
  last_updated: Date;

  @Prop({ required: true })
  resume_id: string;

  @Prop()
  cover_letter: string;
}

export const JobApplicationsSchema =
  SchemaFactory.createForClass(JobApplications);
