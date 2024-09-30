import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Request, Response } from 'express';

import {
  CandidateEmailSigninDto,
  EmployerEmailSigninDto,
} from '../employer/dto/email.signin.dto';
import {
  CandidateEmailSignupDto,
  EmployerEmailSignupDto,
} from '../employer/dto/email.signup.dto';

import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AuthGuard as CommonGuard } from '../guards/auth.guard';
import { MagicLoginStrategy } from './strategies/magiclink.strategy';
import { AuthService } from './auth.service';
import { UserType } from './types/index.type';
import { GoogleOAuthGuard } from '../guards/google.guard';
import { LinkedinOAuthGuard } from '../guards/linkedin.guard';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
    private magicStrategy: MagicLoginStrategy,
  ) {}

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {}

  @Get('linkedin')
  @UseGuards(LinkedinOAuthGuard)
  async linkedinAuth() {}

  @Get('google/redirect')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const user = await this.authService.googleLogin(req);
      const result = await this.authService.generateTokens(
        {
          email: user.email,
          userType: UserType.CANDIDATE,
        },
        'GOOGLE',
      );

      res.cookie(
        this.configService.get<string>('JWT_COOKIE_NAME'),
        result.access_token,
        {
          httpOnly: true,
          secure: true,
          maxAge: 1000 * 60 * 60 * 24 * 30,
          domain: this.configService.get('COOKIE_DOMAIN'),
        },
      );
      return res.redirect(`${this.configService.get('FRONTEND_URL')}/auth`);
    } catch (err) {
      console.log(err);
      throw new Error('Failed to login with google');
    }
  }

  @Get('linkedin/redirect')
  @UseGuards(LinkedinOAuthGuard)
  async linkedinAuthRedirect(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const user = await this.authService.googleLogin(req);
      const result = await this.authService.generateTokens(
        {
          email: user.email,
          userType: UserType.CANDIDATE,
        },
        'GOOGLE',
      );

      res.cookie(
        this.configService.get<string>('JWT_COOKIE_NAME'),
        result.access_token,
        {
          httpOnly: true,
          secure: true,
          maxAge: 1000 * 60 * 60 * 24 * 30,
          domain: this.configService.get('COOKIE_DOMAIN'),
        },
      );
      return res.redirect(`${this.configService.get('FRONTEND_URL')}/auth`);
    } catch (err) {
      console.log(err);
      throw new Error('Failed to login with google');
    }
  }

  @Post('employer/sign-up')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Employer Signup (without Organization)' })
  @ApiBody({
    description: 'Employer signup details',
    type: EmployerEmailSignupDto,
  })
  @ApiResponse({ status: 201, description: 'Employer signed up successfully' })
  async signupEmployer(
    @Body() body: EmployerEmailSignupDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const result = await this.authService.findUser(
      body.email,
      UserType.CANDIDATE,
    );

    if (result) {
      throw new UnauthorizedException('Kindly Login!');
    }

    const { email } = body;

    req.body.destination = email;

    req.body.usertype = UserType.EMPLOYER;

    return this.magicStrategy.send(req, res);
  }

  @Post('employer/sign-in')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Send Magic Link for Employer Signin' })
  @ApiBody({
    description: 'Employer email to receive the magic login link',
    type: EmployerEmailSigninDto,
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
    @Body() body: EmployerEmailSigninDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
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
    req.body.usertype = UserType.EMPLOYER;

    return this.magicStrategy.send(req, res);
  }

  @Post('candidate/sign-up')
  @UsePipes(new ValidationPipe())
  async signupCandidate(
    @Body() body: CandidateEmailSignupDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const result = await this.authService.findUser(
      body.email,
      UserType.CANDIDATE,
    );

    if (result) {
      throw new UnauthorizedException('Kindly Login!');
    }

    const { email } = body;

    req.body.destination = email;

    req.body.usertype = UserType.CANDIDATE;

    return this.magicStrategy.send(req, res);
  }

  @Post('candidate/sign-in')
  @UsePipes(new ValidationPipe())
  async signinCandidate(
    @Body() body: CandidateEmailSigninDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const result = await this.authService.validateUser(
      body.email,
      UserType.CANDIDATE,
    );

    if (result) {
      if (result.provider !== 'EMAIL_PASSWORD') {
        throw new UnauthorizedException(
          'Account already exists with a different account provider',
        );
      }
    }

    req.body.destination = body.email;
    req.body.usertype = UserType.CANDIDATE;

    return this.magicStrategy.send(req, res);
  }

  @Get('login/callback')
  @UseGuards(AuthGuard('magic-login'))
  async magicCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('No user from magic link');
    }

    const result = await this.authService.generateTokens(
      req.user as never,
      'EMAIL_PASSWORD',
    );

    res.cookie(
      this.configService.get<string>('JWT_COOKIE_NAME'),
      result.access_token,
      {
        httpOnly: true,
        secure: true,
        maxAge: 1000 * 60 * 60 * 24 * 30,
        domain: this.configService.get('COOKIE_DOMAIN'),
      },
    );

    return {
      code: 200,
      message: 'Login successful',
    };
  }

  @Get('logout')
  @UseGuards(CommonGuard)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(this.configService.get<string>('JWT_COOKIE_NAME'));

    return {
      code: 200,
      message: 'Logout successful',
    };
  }

  @UseGuards(CommonGuard)
  @Get('user')
  async getAuthUser(@Req() req: Request) {
    const user = await this.authService.getAuthUser(req.user);
    return {
      ...user,
      role: (req.user as any).role,
      token: req.headers.authorization,
    };
  }
}
