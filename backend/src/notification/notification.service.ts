import { Inject, Injectable } from '@nestjs/common';
import { UserEntity } from '@app/user/entity/user.entity';
import { Client } from '@nestjs/microservices/external/nats-client.interface';
import { UserForNotification } from '@app/user/types/userForNotification.type';
import { v4 as uuidv4 } from 'uuid';
import { CachingService } from '@app/caching/caching.service';

@Injectable()
export class NotificationService {
  constructor(
    @Inject('MAIL_SERVICE') private readonly client: Client,
    private cachingService: CachingService,
  ) {}

  async sendUserConfirmation(user: UserEntity) {
    const confirmationToken = String(uuidv4());
    await this.cachingService.setUsersVerificationToken(
      user,
      confirmationToken,
    );
    const userForEmailNotification = new UserForNotification(
      user,
      confirmationToken,
    );
    this.client.emit('user_created', userForEmailNotification);
  }

  async sendPasswordResetURL(user: UserEntity) {
    const passwordResetToken = String(uuidv4());
    await this.cachingService.setUsersPasswordResetToken(
      user,
      passwordResetToken,
    );
    const userForEmailNotification = new UserForNotification(
      user,
      passwordResetToken,
    );
    this.client.emit('user_requested_password_reset', userForEmailNotification);
  }
}
