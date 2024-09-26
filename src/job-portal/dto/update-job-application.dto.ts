import { IsEnum, IsString } from 'class-validator';

export class UpdateJobApplicationDto {
  @IsEnum([
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
  ])
  application_status:
    | 'application_recieved'
    | 'under_review'
    | 'shortlisted'
    | 'assessment_scheduled'
    | 'interview_scheduled'
    | 'interview_in_progress'
    | 'interview_completed'
    | 'offer_made'
    | 'offer_accepted'
    | 'offer_rejected'
    | 'hired'
    | 'rejected'
    | 'on_hold';

  @IsString()
  user_id: string;
}
