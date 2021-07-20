import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { EventPattern } from '@nestjs/microservices';
import { User } from './types/user.type';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('user_created')
  async userCreated(user: User) {
    await this.appService.sendUserConfirmation(user);
  }

  @EventPattern('user_requested_password_reset')
  async passwordResetRequested(user: User) {
    await this.appService.sendPasswordResetLinkForUser(user);
  }
}
