import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { isCompanyMail as IsCompanyMail } from './companyMailValidator';

export class EmailSignupDto {
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

  @ApiProperty({
    example: 'password123',
    description: 'The password of the employer',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}
