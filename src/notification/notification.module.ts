import { Module } from '@nestjs/common';
import { CloudModule } from 'src/cloud/cloud.module';
import { NotificationService } from './notification.service';

@Module({
  imports: [CloudModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
