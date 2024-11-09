import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';

@Injectable()
export class LinkedinStrategy extends PassportStrategy(Strategy, 'linkedin') {
    constructor() {
        super({
            clientID: process.env.LINKEDIN_CLIENT_ID,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
            callbackURL: `${process.env.BACKEND_URL}/v1/auth/linkedin/redirect`,
            scope: ['openid', 'profile', 'email'],
            state: true,
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (err, user) => void,
    ): Promise<any> {
        const { given_name, family_name, email, picture } = profile;
        const user = {
            email: email,
            firstName: given_name,
            lastName: family_name,
            picture: picture,
            accessToken,
            refreshToken,
        };
        done(null, user);
    }
}
