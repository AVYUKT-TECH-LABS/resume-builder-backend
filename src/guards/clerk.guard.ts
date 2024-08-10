import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger: Logger = new Logger();
  private readonly clerkClient: ReturnType<typeof createClerkClient>;

  constructor(private configService: ConfigService) {
    this.clerkClient = this.configService.get('clerk');
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies.__session;

    if (!token) throw new UnauthorizedException();

    try {
      const payload = await this.clerkClient.verifyToken(token);
      const { sub, sid, iat, exp } = payload;
      const user = {
        id: sub,
        sessionId: sid,
        issuedAt: iat,
        expiresAt: exp,
      };
      request['user'] = user;
    } catch (err) {
      this.logger.error(err);
      throw new UnauthorizedException();
    }

    return true;
  }
}
