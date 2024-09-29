import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

import { Request } from 'express';
import { UserType } from '../auth/types/index.type';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CandidateJwtAuthGuard implements CanActivate {
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

      let candidate: Partial<User> | null = null;

      if (payload.role !== UserType.CANDIDATE) {
        return false;
      }

      candidate = await this.prisma.user.findFirst({
        where: {
          email: payload.sub,
        },
        select: {
          name: true,
          email: true,
          id: true,
          clerkId: true,
          credits: true,
          created_at: true,
          updated_at: true,
          provider: true,
        },
      });

      request.candidate = candidate;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token, Kindly Login!');
    }
  }
}
