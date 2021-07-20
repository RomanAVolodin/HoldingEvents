import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NotificationService } from '@app/notification/notification.service';
import { CachingModule } from '@app/caching/caching.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MAIL_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://rabbit:rabbit@localhost:5672'],
          queue: 'mail_notification_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
    CachingModule,
  ],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
