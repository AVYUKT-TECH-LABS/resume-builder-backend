import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export enum JobType {
  full_time = 'full_time',
  part_time = 'part_time',
  contract = 'contract',
  internship = 'internship',
  both = 'both',
}

export class CreateJobPreferenceDto {
  @ApiProperty({ enum: JobType, description: 'Type of job preferred' })
  @IsEnum(JobType)
  @IsNotEmpty()
  jobType: JobType;

  @ApiProperty({ minimum: 0, description: 'Minimum salary expected' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  minSalary: number;

  @ApiProperty({ minimum: 0, description: 'Maximum salary expected' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  maxSalary: number;

  @ApiProperty({ description: 'Preferred job location' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ description: 'Preference for remote work' })
  @IsBoolean()
  remoteWork: boolean;
}

export class UpdateJobPreferenceDto {
  @ApiProperty({
    enum: JobType,
    description: 'Type of job preferred',
    required: false,
  })
  @IsEnum(JobType)
  @IsNotEmpty()
  jobType?: JobType;

  @ApiProperty({
    minimum: 0,
    description: 'Minimum salary expected',
    required: false,
  })
  @IsNumber()
  @Min(0)
  minSalary?: number;

  @ApiProperty({
    minimum: 0,
    description: 'Maximum salary expected',
    required: false,
  })
  @IsNumber()
  @Min(0)
  maxSalary?: number;

  @ApiProperty({ description: 'Preferred job location', required: false })
  @IsString()
  @IsNotEmpty()
  location?: string;

  @ApiProperty({ description: 'Preference for remote work', required: false })
  @IsBoolean()
  remoteWork?: boolean;
}
