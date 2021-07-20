import { UserEntity } from '@app/user/entity/user.entity';

export type IUserResponseInterface = Omit<
  UserEntity,
  'password' | 'hashPassword' | 'role'
> & { role: string };
