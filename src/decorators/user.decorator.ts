import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../interfaces/user.interface';

export const GetUser = createParamDecorator(
  (_, ctx: ExecutionContext): User => {
    // if (process.env.NODE_ENV !== 'development') {
    const request = ctx.switchToHttp().getRequest();
    // console.log(request);
    return request.user;
    // } else {
    //   return {
    //     id: 'user_2kDvvGWNsQebDuVDQYIImBq3KTY',
    //     sessionId: 'test-session',
    //     issuedAt: 1,
    //     expiresAt: 2,
    //   };
    // }
  },
);
