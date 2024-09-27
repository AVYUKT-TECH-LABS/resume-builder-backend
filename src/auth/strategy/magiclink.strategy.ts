import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-magic-login';
import { NotificationService } from 'src/notification/notification.service';
import { AuthService } from '../auth.service';
import { UserType } from '../types/index.type';

export class MagicLoginStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(MagicLoginStrategy.name);

  constructor(
    private configService: ConfigService,
    private notificationService: NotificationService,
    private authService: AuthService,
  ) {
    super({
      secret: process.env.MAGIC_LINK_SECRET,
      jwtOptions: {
        expiresIn: '15m',
      },
      callbackUrl: `${process.env.BACKEND_URL}/auth/login/callback`,
      sendMagicLink: async (
        destination: string,
        href: string,
        userType: UserType,
      ) => {
        this.logger.debug(
          `sending email to ${destination} with link ${href} for user type ${userType}`,
        );

        // this.notificationService.sendMail('email-queue', {
        //   body: `This is your magic login link, ${userType}: ${href}`,
        //   subject: `Magic Link Login for ${userType}`,
        //   to: destination,
        // });
      },
      verify: async (payload, callback) => {
        callback(null, this.validate(payload));
      },
    });
  }

  async validate(payload: { destination: string; userType: UserType }) {
    const { destination, userType } = payload;

    const user = await this.authService.validateUser(destination, userType);

    return user;
  }
}
