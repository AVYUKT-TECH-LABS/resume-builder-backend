import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { CloudModule } from './cloud/cloud.module';
import clerkConfig from './config/clerk.config';
import { IpInfoModule } from './ip-info/ip-info.module';
import clerkConfig from './config/clerk.config';
import { IpInfoModule } from './ip-info/ip-info.module';
import { JobPortalModule } from './job-portal/job-portal.module';
import { JobsModule } from './jobs/jobs.module';
import { LinkedinOptimizerModule } from './linkedin-optimizer/linkedin-optimizer.module';
import { OpenAIModule } from './openai/openai.module';
import { PaymentsModule } from './payments/payments.module';
import { ResumeModule } from './resume/resume.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [clerkConfig],
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
    JobPortalModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [NotificationService],
})
export class AppModule {}
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(ClerkAuthMiddleware).forRoutes('*');
//   }
// }
