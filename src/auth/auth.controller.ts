import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Request, Response } from 'express';

import { EmailSigninDto } from 'src/employer/dto/email.signin.dto';
import { EmailSignupDto } from 'src/employer/dto/email.signup.dto';

import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { MagicLinkDto } from './dto/magiclink.dto';
import { MagicLoginStrategy } from './strategy/magiclink.strategy';
import { UserType } from './types/index.type';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
    private magicStrategy: MagicLoginStrategy,
  ) {}

  @Post('send-link')
  async sendLink(
    @Res({ passthrough: true }) res: Response,
    @Body() body: MagicLinkDto,
    @Req() req: Request,
  ) {
    // const user = await this.authService.validateUser(body.destination);
    // if (user) {
    //   if (user.provider !== 'EMAIL_PASSWORD') {
    //     throw new UnauthorizedException(
    //       'A user with that email already exists with a different account provider',
    //     );
    //   }
    // }

    return this.magicStrategy.send(req, res);
  }

  @Post('employer/sign-up')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Employer Signup (without Organization)' })
  @ApiBody({ description: 'Employer signup details', type: EmailSignupDto })
  @ApiResponse({ status: 201, description: 'Employer signed up successfully' })
  async signupEmployer(
    @Body() body: EmailSignupDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const { email } = body;
    const result = await this.authService.emailEmployerSignup(body);

    if (result) {
      req.body.destination = email;

      return this.magicStrategy.send(req, res);
    }

    throw new UnauthorizedException('Employer signup failed');
  }

  @Post('employer/sign-in')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Send Magic Link for Employer Signin' })
  @ApiBody({
    description: 'Employer email to receive the magic login link',
    type: EmailSigninDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Magic link sent to employer email successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Account exists with different provider',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email address or missing email',
  })
  async signinEmployer(
    @Body() body: EmailSigninDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
    // @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.validateUser(
      body.email,
      UserType.EMPLOYER,
    );

    if (result) {
      if (result.provider !== 'EMAIL_PASSWORD') {
        throw new UnauthorizedException(
          'Account already exists with a different account provider',
        );
      }
    }

    req.body.destination = body.email;

    return this.magicStrategy.send(req, res);
  }
}
