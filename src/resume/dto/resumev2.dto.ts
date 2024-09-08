import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class PictureDTO {
  @IsBoolean()
  enabled: boolean;

  @IsUrl()
  url: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  size: number;

  @IsNumber()
  @Min(0)
  @Max(50)
  radius: number;

  @IsBoolean()
  border: boolean;

  @IsBoolean()
  grayscale: boolean;
}

class PersonalInformationDTO {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @Length(1, 100)
  title: string;

  @IsPhoneNumber()
  phone: string;

  @IsEmail()
  email: string;
}

class EmploymentHistoryDTO {
  @IsString()
  @Length(1, 100)
  title: string;

  @IsString()
  @Length(1, 100)
  companyName: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsString()
  @Length(1, 100)
  location: string;

  @IsString()
  @Length(1, 1000)
  summary: string;
}

class EducationDTO {
  @IsString()
  @Length(1, 100)
  institute: string;

  @IsString()
  @Length(1, 100)
  degree: string;

  @IsString()
  @Length(1, 20)
  score: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsString()
  @Length(1, 100)
  location: string;

  @IsString()
  @Length(1, 1000)
  summary: string;
}

class ProjectDTO {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @Length(1, 500)
  description: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsUrl()
  link: string;

  @IsString()
  @Length(1, 1000)
  summary: string;
}

class FontConfigDTO {
  @IsString()
  fontFamily: string;

  @IsOptional()
  @IsString()
  fontWeight?: string;

  @IsOptional()
  @IsString()
  fontStyle?: string;
}

class FontSizesDTO {
  @IsNumber()
  @Min(1)
  @Max(100)
  heading: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  subHeading: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  content: number;

  @IsNumber()
  @Min(1)
  @Max(3)
  lineHeight: number;
}

class ColorsDTO {
  @IsString()
  primary: string;

  @IsString()
  background: string;

  @IsString()
  text: string;
}

class PageConfigDTO {
  @IsEnum(['A4', 'letter'])
  size: 'A4' | 'letter';

  @IsOptional()
  @IsString()
  background?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  margin: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  spacing: number;

  @ValidateNested()
  @Type(() => FontConfigDTO)
  font: FontConfigDTO;

  @ValidateNested()
  @Type(() => FontSizesDTO)
  fontSizes: FontSizesDTO;

  @ValidateNested()
  @Type(() => ColorsDTO)
  colors: ColorsDTO;

  @IsString()
  template: string;
}

export class CreateResumeDTO {
  @ValidateNested()
  @Type(() => PageConfigDTO)
  pageConfig: PageConfigDTO;

  @ValidateNested()
  @Type(() => PictureDTO)
  picture: PictureDTO;

  @ValidateNested()
  @Type(() => PersonalInformationDTO)
  personalInformation: PersonalInformationDTO;

  @IsString()
  @Length(1, 2000)
  summary: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmploymentHistoryDTO)
  @ArrayMinSize(0)
  @ArrayMaxSize(20)
  employmentHistory: EmploymentHistoryDTO[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDTO)
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  education: EducationDTO[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDTO)
  @ArrayMinSize(0)
  @ArrayMaxSize(20)
  projects: ProjectDTO[];

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(50)
  skills: string[];
}

export class UpdateResumeDTO implements Partial<CreateResumeDTO> {
  @IsOptional()
  @ValidateNested()
  @Type(() => PageConfigDTO)
  pageConfig?: PageConfigDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => PictureDTO)
  picture?: PictureDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => PersonalInformationDTO)
  personalInformation?: PersonalInformationDTO;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  summary?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmploymentHistoryDTO)
  @ArrayMinSize(0)
  @ArrayMaxSize(20)
  employmentHistory?: EmploymentHistoryDTO[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDTO)
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  education?: EducationDTO[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDTO)
  @ArrayMinSize(0)
  @ArrayMaxSize(20)
  projects?: ProjectDTO[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(50)
  skills?: string[];
}
