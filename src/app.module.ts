import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import clerkConfig from './config/clerk.config';
import { ResumeModule } from './resume/resume.module';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(ClerkAuthMiddleware).forRoutes('*');
//   }
// }
