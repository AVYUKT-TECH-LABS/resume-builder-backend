import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ConfigService } from '@nestjs/config';
import { Employer, User } from '@prisma/client';
import { CandidateService } from 'src/candidate/candidate.service';
import {
  CandidateEmailSignupDto,
  EmployerEmailSignupDto,
} from 'src/employer/dto/email.signup.dto';
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

  async emailEmployerSignup(data: EmployerEmailSignupDto) {
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

  async emailCandidateSignUp(data: CandidateEmailSignupDto) {
    const employee = await this.candidateService.findUserByEmail(data.email);

    if (employee) {
      throw new ConflictException('Account already exists!');
    }

    await this.candidateService.create(data);

    return {
      success: true,
      message: 'Account created successfully.',
    };
  }

  async findUser(email: string, userType: UserType) {
    let user: Employer | User | null = null;

    if (userType === UserType.EMPLOYER) {
      user = await this.employerService.findEmployeeByEmail(email);
    }

    if (userType === UserType.CANDIDATE) {
      user = await this.candidateService.findUserByEmail(email);
    }

    return user;
  }

  async validateUser(email: string, userType: UserType) {
    const user = await this.findUser(email, userType);

    if (!user) {
      throw new UnauthorizedException('Account not found!');
    }

    return user;
  }

  async validateUserCallback(email: string, userType: UserType, name: string) {
    const user = await this.findUser(email, userType);

    let newUser: Employer | User | null = null;

    if (!user) {
      if (userType === UserType.CANDIDATE) {
        newUser = await this.candidateService.create({
          email,
          name,
        });
      }

      if (userType === UserType.EMPLOYER) {
        newUser = await this.employerService.createEmployeeWithoutCompany({
          email,
          name,
        });
      }
    }

    return newUser;
  }

  async generateTokens(
    auth_user: any,
    provider?: Pick<User, 'provider'>['provider'],
  ) {
    const { usertype, email } = auth_user;

    let user: Employer | User | null;

    if (usertype === UserType.EMPLOYER) {
      user = await this.employerService.findEmployeeByEmail(email);

      if (user.provider != provider) {
        throw new UnauthorizedException(
          'A user with that email already exists with different account provider',
        );
      }
    }

    if (usertype === UserType.CANDIDATE) {
      user = await this.candidateService.findUserByEmail(email);

      if (user.provider != provider) {
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
