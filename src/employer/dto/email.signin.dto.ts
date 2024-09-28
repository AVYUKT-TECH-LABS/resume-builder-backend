import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { isCompanyMail as IsCompanyMail } from './companyMailValidator';

export class EmailSigninDto {
  @ApiProperty({
    example: 'employer@example.com',
    description: 'The email of the employer',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsCompanyMail()
  email: string;
}
