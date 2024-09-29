import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CandidateModule } from '../candidate/candidate.module';
import { EmployerModule } from '../employer/employer.module';
import { NotificationModule } from '../notification/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MagicLoginStrategy } from '../strategy/magiclink.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    EmployerModule,
    CandidateModule,
    PrismaModule,
    NotificationModule,
    JwtModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, MagicLoginStrategy],
})
export class AuthModule {}
