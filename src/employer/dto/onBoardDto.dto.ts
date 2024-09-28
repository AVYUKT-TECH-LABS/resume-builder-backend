import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class OrgSocialLinksDto {
  @IsOptional()
  @IsUrl({}, { message: 'Invalid Facebook URL' })
  facebook?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid Twitter URL' })
  twitter?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid Instagram URL' })
  instagram?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid LinkedIn URL' })
  linkedin?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid YouTube URL' })
  youtube?: string;
}

export class OnBoardingDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsUrl({}, { message: 'Invalid logo URL' })
  logo_url: string;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  @MaxLength(280, { message: 'Max limit reached' })
  description: string;

  @IsNotEmpty({ message: 'City is required' })
  @IsString()
  city: string;

  @IsNotEmpty({ message: 'Industry is required' })
  @IsString()
  industry: string;

  @IsNotEmpty({ message: 'Number of employees is required' })
  @IsString()
  num_employees: string;

  @IsNotEmpty()
  @IsUrl({}, { message: 'Invalid website URL' })
  website: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrgSocialLinksDto)
  @IsObject()
  org_social_links?: OrgSocialLinksDto;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email domain' })
  mailDomain?: string;
}
