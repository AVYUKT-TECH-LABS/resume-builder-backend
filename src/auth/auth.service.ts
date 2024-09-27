import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { Employer, User } from '@prisma/client';
import { EmailSignupDto } from 'src/employer/dto/email.signup.dto';
import { EmployerService } from 'src/employer/employer.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserType } from './types/index.type';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    // private userService: UsersService,
    private employerService: EmployerService,
    private prismaService: PrismaService,
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
}
