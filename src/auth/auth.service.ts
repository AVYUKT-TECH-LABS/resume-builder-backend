import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ConfigService } from '@nestjs/config';
import { Employer, User } from '@prisma/client';
import { CandidateService } from 'src/candidate/candidate.service';
import { EmailSignupDto } from 'src/employer/dto/email.signup.dto';
import { EmployerService } from 'src/employer/employer.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserType } from './types/index.type';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private candidateService: CandidateService,
    private employerService: EmployerService,
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}

  async emailEmployerSignup(data: EmailSignupDto) {
    const employee = await this.employerService.findEmployeeByEmail(data.email);

    if (employee) {
      throw new ConflictException('Account already exists!');
    }

    await this.employerService.createEmployeeWithoutCompany(data);

    return {
      success: true,
      message: 'Account created successfully.',
    };
  }

  async validateUser(email: string, userType: UserType) {
    let user: Employer | User | null;

    if (userType === UserType.USER) {
      user = await this.prismaService.user.findFirst({
        where: { email },
      });
    }

    if (userType === UserType.EMPLOYER) {
      user = await this.prismaService.employer.findFirst({
        where: { email },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Account not found, Kindly Sign up!');
    }

    return user;
  }

  async generateTokens(
    auth_user: any,
    provider?: Pick<User, 'provider'>['provider'],
  ) {
    const { usertype, email } = auth_user;

    let user: Employer | User | null;

    if (usertype === UserType.EMPLOYER) {
      user = await this.employerService.findEmployeeByEmail(email);

      if (user && user.provider != provider) {
        throw new UnauthorizedException(
          'A user with that email already exists with different account provider',
        );
      }
    }
    if (usertype === UserType.USER) {
      user = await this.candidateService.findUserByEmail(email);
      if (user && user.provider != provider) {
        throw new UnauthorizedException(
          'A user with that email already exists with different account provider',
        );
      }
    }

    const payload = {
      sub: auth_user.email,
      id: user ? user.id : null,
      role: usertype,
    };

    return {
      code: 200,
      access_token: await this.getJwtToken(payload),
    };
  }

  async getJwtToken(payload: {
    sub: string;
    id: string;
    role: string;
  }): Promise<string> {
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });
  }
}
