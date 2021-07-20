import { UserEntity } from '@app/user/entity/user.entity';

export class UserForNotification {
  id: string;
  email: string;
  full_name: string;
  confirmation_token: string;

  constructor(user: Partial<UserEntity>, token: string) {
    this.id = user.id;
    this.email = user.email;
    this.full_name = user.profile.lastName + ' ' + user.profile.firstName;
    this.confirmation_token = token;
  }
}
