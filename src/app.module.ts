import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import clerkConfig from './config/clerk.config';
import { ResumeModule } from './resume/resume.module';
import { CloudModule } from './cloud/cloud.module';
import { OpenAIModule } from './openai/openai.module';
import { PaymentsModule } from './payments/payments.module';
import { AppController } from './app.controller';
import { JobsModule } from './jobs/jobs.module';
import { LinkedinOptimizerModule } from './linkedin-optimizer/linkedin-optimizer.module';
import { NotificationService } from './notification/notification.service';
import { NotificationModule } from './notification/notification.module';
import { IpInfoModule } from './ip-info/ip-info.module';

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
