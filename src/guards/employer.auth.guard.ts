import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Employer } from '@prisma/client';

import { Request } from 'express';
import { UserType } from 'src/auth/types/index.type';
import { EmployerService } from 'src/employer/employer.service';

@Injectable()
export class EmployerJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly employerService: EmployerService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const token =
      request.cookies[this.configService.get<string>('JWT_COOKIE_NAME')];

    if (!token) {
      throw new UnauthorizedException('Token not found, Kindly Login!');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      let employer: Employer | null = null;

      if (payload.role !== UserType.EMPLOYER) {
        return false;
      }

      employer = await this.employerService.findEmployeeByEmail(payload.sub);

      request.employer = employer;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token, Kindly Login!');
    }
  }
}
