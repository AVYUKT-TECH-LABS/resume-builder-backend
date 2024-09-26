import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type JobDocument = HydratedDocument<Job>;

@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true })
  employer_id: string;

  @Prop({ required: true, enum: ['active', 'paused', 'closed'] })
  status: string;

  @Prop({ required: true })
  company_name: string;

  @Prop({ required: true })
  job_title: string;

  @Prop({ required: true, enum: ['full_time', 'part_time', 'both'] })
  job_type: string;

  @Prop({ required: true })
  is24_7: boolean;

  @Prop({
    required: true,
    enum: ['hybrid', 'remote'],
  })
  work_location_type: string;

  @Prop()
  office_address: string;

  @Prop({
    required: true,
    enum: ['fixed_only', 'fixed_and_incentive', 'incentive_only'],
  })
  pay_type: string;

  @Prop()
  fixed_salary: string;

  @Prop()
  avg_incentive: string;

  @Prop({ type: [String] })
  perks: string[];

  @Prop({ required: true })
  joining_fee_required: boolean;

  @Prop()
  joining_fee: string;

  @Prop({
    required: true,
    enum: ['10_or_below_10', '12_pass', 'diploma', 'graduate'],
  })
  minimum_edu: string;

  @Prop({ required: true, enum: ['NA', 'basic', 'intermediate', 'proficient'] })
  english_level: string;

  @Prop({ required: true, enum: ['freshers', 'intermediate', 'experts'] })
  experience_level: string;

  @Prop()
  total_experience: string;

  @Prop({ enum: ['male', 'female', 'both'] })
  gender: string;

  @Prop()
  age: string;

  @Prop({ type: [String] })
  regional_languages: string[];

  @Prop({ type: [String] })
  required_assets: string[];

  @Prop({ type: [String] })
  skills: string[];

  @Prop()
  jd: string;

  @Prop({ required: true, enum: ['in_person', 'walk_in', 'telephonic_online'] })
  interview_type: string;

  @Prop()
  interview_address: string;

  @Prop()
  walk_in_start_date: string;

  @Prop()
  walk_in_end_date: string;

  @Prop()
  walk_in_timings: string;

  @Prop()
  other_instructions: string;

  @Prop()
  online_interview_link: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const JobSchema = SchemaFactory.createForClass(Job);
