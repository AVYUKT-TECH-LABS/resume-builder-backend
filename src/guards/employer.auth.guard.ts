import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Employer } from '@prisma/client';

import { Request } from 'express';
import { UserType } from '../auth/types/index.type';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployerJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
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

      let employer: Partial<Employer> | null = null;

      if (payload.role !== UserType.EMPLOYER) {
        return false;
      }

      employer = await this.prisma.employer.findFirst({
        where: {
          email: payload.sub,
        },
        select: {
          email: true,
          id: true,
          name: true,
          provider: true,
          is_deleted: true,
          is_verified: true,
          deleted_at: true,
          updated_at: true,
          deletion_message: true,
          clerkId: true,
          organization_id: true,
        },
      });

      if (!employer.organization_id) {
        if (
          request.url !== '/v1/employer/on-boarding' &&
          request.url !== '/v1/employer/upload'
        ) {
          throw new ForbiddenException('Complete on-boarding first!');
        }
      }

      request.employer = employer;
      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException('Invalid token, Kindly Login!');
    }
  }
}
