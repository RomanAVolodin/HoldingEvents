import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from './types/user.type';

@Injectable()
export class AppService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(user: User) {
    const url = `${process.env.FRONTEND_HOST}/auth/confirm?token=${user.confirmation_token}`;

    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Welcome to Nice App! Confirm your Email',
      template: './confirmation', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        full_name: user.full_name,
        url,
      },
    });
  }

  async sendPasswordResetLinkForUser(user: User) {
    const url = `${process.env.FRONTEND_HOST}/auth/password-reset?token=${user.confirmation_token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'You have just requested the password reset',
      template: './password-reset-request',
      context: {
        full_name: user.full_name,
        url,
      },
    });
  }
}
