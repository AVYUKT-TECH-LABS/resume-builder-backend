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
    if (process.env.NODE_ENV == 'development') return true;
    const request = context.switchToHttp().getRequest();

    // Extract token from Authorization header
    const authHeader = request.headers['authorization'];
    if (!authHeader)
      throw new UnauthorizedException('Authorization header missing');

    const token = authHeader.split(' ')[1];
    if (!token)
      throw new UnauthorizedException('Token missing in Authorization header');

    try {
      // Verify the token using Clerk's client
      const payload = await this.clerkClient.verifyToken(token);
      const { sub, sid, iat, exp } = payload;

      // Attach the user information to the request object
      request['user'] = {
        id: sub,
        sessionId: sid,
        issuedAt: iat,
        expiresAt: exp,
      };
    } catch (err) {
      this.logger.error(err);
      throw new UnauthorizedException('Token verification failed');
    }

    return true;
  }
}
