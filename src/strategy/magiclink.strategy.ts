import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import Strategy from 'passport-magic-login';
import { NotificationService } from '../notification/notification.service';
import { AuthService } from '../auth/auth.service';
import { UserType } from '../auth/types/index.type';

@Injectable()
export class MagicLoginStrategy extends PassportStrategy(
  Strategy,
  'magic-login',
) {
  private readonly logger = new Logger(MagicLoginStrategy.name);

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
  ) {
    super({
      secret: process.env.JWT_SECRET,
      jwtOptions: {
        expiresIn: '15m',
      },
      callbackUrl: `${process.env.FRONTEND_URL}/auth/callback`,
      sendMagicLink: async (
        destination: string,
        href: string,
        verificationCode: string,
        req: Request,
      ) => {
        href += `&role=${req.body.usertype}`;
        console.log(href);
        this.notificationService.sendMail('emails-queue', {
          body: `This is your magic login link: ${href}`,
          subject: `Magic Link Login`,
          to: 'shivamtaneja.me@gmail.com',
        });
      },
      verify: async (payload, callback) => {
        callback(null, this.validate(payload));
      },
    });
  }

  async validate(payload: {
    destination: string;
    name: string;
    usertype: UserType;
    code: string;
  }) {
    const { destination, usertype, name } = payload;

    const user = await this.authService.validateUserCallback(
      destination,
      usertype,
      name,
    );

    return { ...user, usertype, name };
  }
}
