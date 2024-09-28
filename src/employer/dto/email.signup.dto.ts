import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { isCompanyMail as IsCompanyMail } from './companyMailValidator';

export class EmployerEmailSignupDto {
  @ApiProperty({
    example: 'employer1',
    description: 'The Username of the employer',
  })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    example: 'employer@example.com',
    description: 'The email of the employer',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsCompanyMail()
  email: string;
}

export class CandidateEmailSignupDto {
  @ApiProperty({
    example: 'employer1',
    description: 'The Username of the employer',
  })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    example: 'employer@example.com',
    description: 'The email of the employer',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
