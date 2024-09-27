import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';
import { EmailSigninDto } from 'src/employer/dto/email.signin.dto';

import { EmailSignupDto } from 'src/employer/dto/email.signup.dto';
import { EmployerService } from 'src/employer/employer.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    // private userService: UsersService,
    private employerService: EmployerService,
    private prismaService: PrismaService,
  ) {}

  async emailEmployerSignup(data: EmailSignupDto) {
    const { password } = data;

    const employee = await this.employerService.findEmployeeByEmail(data.email);

    if (employee) {
      throw new ConflictException('Account already exists!');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const employeeCreated =
      await this.employerService.createEmployeeWithoutCompany({
        ...data,
        password: hashedPassword,
      });

    return {
      success: true,
      message: 'Account created successfully.',
    };
  }

  async emailEmployerSignin(data: EmailSigninDto) {
    const { email, password } = data;

    const employee = await this.employerService.findEmployeeByEmail(email);

    if (!employee) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(password, employee.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const payload = { email: employee.email, sub: employee.id };
    const token = this.jwtService.sign(payload);

    const response = {
      success: true,
      token,
    };

    if (!employee.organization_id) {
      return {
        ...response,
        message: 'Sign-in successful, but onboarding is required.',
        redirectUrl: '/onboarding',
      };
    }

    return {
      ...response,
      message: 'Sign-in successful.',
    };
  }
}
