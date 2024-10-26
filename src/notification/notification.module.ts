import { Global, Module } from '@nestjs/common';
import { CloudModule } from '../cloud/cloud.module';
import { NotificationService } from './notification.service';
@Global()
@Module({
  imports: [CloudModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
