import {
  Body,
  Controller,
  Post,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Response } from 'express';

import { EmailSigninDto } from 'src/employer/dto/email.signin.dto';
import { EmailSignupDto } from 'src/employer/dto/email.signup.dto';

import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('employer/signup')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Employer Signup (without Organization)' })
  @ApiBody({ description: 'Employer signup details', type: EmailSignupDto })
  @ApiResponse({ status: 201, description: 'Employer signed up successfully' })
  async signupEmployer(@Body() body: EmailSignupDto) {
    return this.authService.emailEmployerSignup(body);
  }

  @Post('employer/signin')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Employer Signin' })
  @ApiBody({ description: 'Employer signin details', type: EmailSigninDto })
  @ApiResponse({ status: 200, description: 'Employer signed in successfully' })
  async signinEmployer(
    @Body() body: EmailSigninDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.emailEmployerSignin(body);

    res.cookie('jwt', result.token, {
      httpOnly: process.env.NODE_ENV === 'production',
      secure: process.env.NODE_ENV === 'production',
    });

    return result;
  }
}
