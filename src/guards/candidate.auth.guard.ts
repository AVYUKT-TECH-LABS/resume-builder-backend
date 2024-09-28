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
import { UserType } from 'src/auth/types/index.type';
import { CandidateService } from 'src/candidate/candidate.service';

@Injectable()
export class CandidateJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly candidateService: CandidateService,
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

      let user: User | null = null;

      if (payload.role === UserType.USER) {
        user = await this.candidateService.findUserByEmail(payload.sub);
      }

      request.user = user;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token, Kindly Login!');
    }
  }
}
