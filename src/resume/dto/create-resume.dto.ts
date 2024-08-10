import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class PageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  background: string | null;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  margins: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  spacing: number;
}

class ContactSettingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  value: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key: string;
}

class ContactDataDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  link: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  location: string;
}

class ContactDto {
  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactSettingDto)
  settings: ContactSettingDto[];

  @ApiProperty()
  @ValidateNested()
  @Type(() => ContactDataDto)
  data: ContactDataDto;
}

class SectionDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  containerId: string | null;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  containerPosition: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsArray()
  @ArrayMinSize(1)
  list: any[];
}

class ResumeDataDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => ContactDto)
  contact: ContactDto;

  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections: SectionDto[];
}

export class CreateResumeDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => PageDto)
  page: PageDto;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  template: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  font?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => ResumeDataDto)
  resume: ResumeDataDto;
}
