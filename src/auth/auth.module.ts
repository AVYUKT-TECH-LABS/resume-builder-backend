import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CandidateModule } from '../candidate/candidate.module';
import { EmployerModule } from '../employer/employer.module';
import { NotificationModule } from '../notification/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MagicLoginStrategy } from './strategies/magiclink.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { LinkedinStrategy } from './strategies/linkedin.strategy';
import { HubspotModule } from 'src/hubspot/hubspot.module';
import { ResumeModule } from 'src/resume/resume.module';

@Module({
    imports: [
        EmployerModule,
        CandidateModule,
        PrismaModule,
        NotificationModule,
        JwtModule,
        HubspotModule,
        ResumeModule
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        MagicLoginStrategy,
        GoogleStrategy,
        LinkedinStrategy,
    ],
})
export class AuthModule { }
