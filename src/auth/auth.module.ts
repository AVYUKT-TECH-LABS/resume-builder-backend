import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CandidateModule } from 'src/candidate/candidate.module';
import { EmployerModule } from 'src/employer/employer.module';
import { NotificationModule } from 'src/notification/notification.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MagicLoginStrategy } from 'src/strategy/magiclink.strategy';
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
