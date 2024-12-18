import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { CloudModule } from './cloud/cloud.module';
import { IpInfoModule } from './ip-info/ip-info.module';
// import { JobPortalModule } from './job-portal/job-portal.module';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { CandidateModule } from './candidate/candidate.module';
import { EmployerModule } from './employer/employer.module';
import { JobsModule } from './jobs/jobs.module';
import { LinkedinOptimizerModule } from './linkedin-optimizer/linkedin-optimizer.module';
import { NotificationModule } from './notification/notification.module';
import { NotificationService } from './notification/notification.service';
import { OpenAIModule } from './openai/openai.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ResumeModule } from './resume/resume.module';
import { CandidatesDatabaseModule } from './candidates-database/candidates-database.module';
import { ResumeProcessorModule } from './resume-processor/resume-processor.module';
import { MigrationsModule } from './migrations/migrations.module';
import { CompanyModule } from './company/company.module';
import { HubspotModule } from './hubspot/hubspot.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        MongooseModule.forRoot(
            'mongodb+srv://divyansh:AOpCdQMGQeXFX1Sf@devcluster.hn4hzms.mongodb.net/resume-builder-dev?retryWrites=true&w=majority&appName=DevCluster',
        ),
        ResumeModule,
        CloudModule,
        OpenAIModule,
        PaymentsModule,
        JobsModule,
        LinkedinOptimizerModule,
        NotificationModule,
        IpInfoModule,
        // JobPortalModule,
        CandidatesDatabaseModule,
        ResumeProcessorModule,
        PrismaModule,
        AuthModule,
        EmployerModule,
        CandidateModule,
        JwtModule,
        ScheduleModule.forRoot(),
        CandidateModule,
        MigrationsModule,
        CompanyModule,
        HubspotModule,
    ],
    controllers: [AppController],
    providers: [NotificationService],
})
export class AppModule { }
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(ClerkAuthMiddleware).forRoutes('*');
//   }
// }
