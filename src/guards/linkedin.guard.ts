import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LinkedinOAuthGuard extends AuthGuard('linkedin') {
  // constructor(private configService: ConfigService) {
  // }
}
