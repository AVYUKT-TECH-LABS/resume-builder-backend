import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ConfigService } from '@nestjs/config';
import { Employer, User } from '@prisma/client';
import { CandidateService } from '../candidate/candidate.service';
import {
  CandidateEmailSignupDto,
  EmployerEmailSignupDto,
} from '../employer/dto/email.signup.dto';
import { EmployerService } from '../employer/employer.service';
import { PrismaService } from '../prisma/prisma.service';
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

  async getAuthUser(requestUser: any) {
    if (requestUser.role == 'Candidate') {
      return this.prismaService.user.findFirst({
        where: {
          id: requestUser.id,
        },
        select: {
          name: true,
          banned: true,
          locked: true,
          hasImage: true,
          imageUrl: true,
          created_at: true,
          updated_at: true,
          email: true,
          id: true,
          credits: true,
        },
      });
    } else if (requestUser.role == 'Employer') {
      return this.prismaService.employer.findFirst({
        where: {
          id: requestUser.id,
        },
        select: {
          name: true,
          banned: true,
          locked: true,
          hasImage: true,
          imageUrl: true,
          created_at: true,
          updated_at: true,
          email: true,
          id: true,
          is_deleted: true,
          deleted_at: true,
          deletion_message: true,
          is_verified: true,
          organization: {
            select: {
              name: true,
              logo_url: true,
            },
          },
        },
      });
    }
  }

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

  async validateUserCallback(
    email: string,
    userType: UserType,
    name: string,
  ): Promise<Employer | User | null> {
    const user = await this.findUser(email, userType);

    if (user) {
      return user;
    }

    switch (userType) {
      case UserType.CANDIDATE:
        return await this.candidateService.create({ email, name });
      case UserType.EMPLOYER:
        return await this.employerService.createEmployeeWithoutCompany({
          email,
          name,
        });
      default:
        throw new Error(`Invalid user type: ${userType}`);
    }
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
