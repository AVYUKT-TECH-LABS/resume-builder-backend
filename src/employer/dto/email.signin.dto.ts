import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
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

  @ApiProperty({
    example: 'password123',
    description: 'The password of the employer',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}
