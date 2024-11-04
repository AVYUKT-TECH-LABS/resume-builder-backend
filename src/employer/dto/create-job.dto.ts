import {
    IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength
} from 'class-validator';

export class CreateJobDto {
  @IsEnum(['active', 'paused', 'closed'])
  status: 'active' | 'paused' | 'closed';

  @IsString()
  @MinLength(3, { message: 'Please enter a valid job title' })
  job_title: string;

  @IsEnum(['full_time', 'part_time', 'both'])
  job_type: 'full_time' | 'part_time' | 'both';

  @IsBoolean()
  is24_7: boolean;

  @IsEnum(['hybrid', 'remote'])
  work_location_type: 'hybrid' | 'remote';

  @IsOptional()
  @IsString()
  office_address?: string;

  @IsString()
  num_openings: string;

  @IsEnum(['fixed_only', 'fixed_and_incentive', 'incentive_only'])
  pay_type: 'fixed_only' | 'fixed_and_incentive' | 'incentive_only';

  @IsOptional()
  @IsString()
  fixed_salary?: string;

  @IsOptional()
  @IsString()
  avg_incentive?: string;

  @IsOptional()
  @IsArray()
  perks?: string;

  @IsBoolean()
  joining_fee_required: boolean;

  @IsOptional()
  @IsString()
  joining_fee?: string;

  // Candidate requirements
  @IsEnum(['ten_or_below_10', 'twelve_pass', 'diploma', 'graduate'])
  minimum_edu: 'ten_or_below_10' | 'twelve_pass' | 'diploma' | 'graduate';

  @IsEnum(['NA', 'basic', 'intermediate', 'proficient'])
  english_level: 'NA' | 'basic' | 'intermediate' | 'proficient';

  @IsEnum(['freshers', 'intermediate', 'experts'])
  experience_level: 'freshers' | 'intermediate' | 'experts';

  @IsOptional()
  @IsString()
  total_experience?: string;

  @IsOptional()
  @IsEnum(['male', 'female', 'both'])
  gender?: 'male' | 'female' | 'both';

  @IsOptional()
  @IsString()
  age?: string;

  @IsOptional()
  @IsArray()
  regional_languages?: string;

  @IsOptional()
  @IsArray()
  required_assets?: string;

  @IsOptional()
  @IsArray()
  skills?: string;

  @IsString()
  @MinLength(1, { message: 'Job Description is required.' })
  @IsNotEmpty()
  jd: string;

  @IsEnum(['in_person', 'walk_in', 'telephonic_online'])
  interview_type: 'in_person' | 'walk_in' | 'telephonic_online';

  @IsOptional()
  @IsString()
  interview_address?: string;

  @IsOptional()
  @IsString()
  walk_in_start_date?: string;

  @IsOptional()
  @IsString()
  walk_in_end_date?: string;

  @IsOptional()
  @IsString()
  walk_in_timings?: string;

  @IsOptional()
  @IsString()
  other_instructions?: string;

  @IsOptional()
  @IsString()
  online_interview_link?: string;
}
