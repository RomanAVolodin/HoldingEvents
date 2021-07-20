import {
  CACHE_MANAGER,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { UserEntity } from '@app/user/entity/user.entity';

@Injectable()
export class CachingService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async setUsersVerificationToken(
    user: UserEntity,
    confirmationToken: string,
  ): Promise<void> {
    await this.cacheManager.set(
      `${process.env.EMAIL_CONFIRM_TOKEN_PREFIX}${confirmationToken}`,
      user.id,
      {
        ttl: Number(process.env.VALIDATION_HASH_TTL_SEC),
      },
    );
    await this.cacheManager.set(
      `${process.env.EMAIL_CONFIRM_TOKEN_PREFIX_REQUESTED_BY}${user.id}`,
      'true',
      {
        ttl: Number(process.env.VALIDATION_HASH_TTL_SEC) * 2,
      },
    );
  }

  async checkIfUserStillPendingEmailConfirmation(
    user: UserEntity,
  ): Promise<boolean> {
    return (
      (await this.cacheManager.get(
        `${process.env.EMAIL_CONFIRM_TOKEN_PREFIX_REQUESTED_BY}${user.id}`,
      )) === 'true'
    );
  }

  async getUserByConfirmationToken(token: string): Promise<string> {
    const id = (await this.cacheManager.get(
      `${process.env.EMAIL_CONFIRM_TOKEN_PREFIX}${token}`,
    )) as string;
    await this.cacheManager.del(
      `${process.env.EMAIL_CONFIRM_TOKEN_PREFIX}${token}`,
    );
    await this.cacheManager.del(
      `${process.env.EMAIL_CONFIRM_TOKEN_PREFIX_REQUESTED_BY}${id}`,
    );
    return id;
  }

  async setUsersPasswordResetToken(
    user: UserEntity,
    passwordResetToken: string,
  ): Promise<void> {
    if (
      (await this.cacheManager.get(
        `${process.env.PASSWORD_CHANGE_TOKEN_PREFIX_REQUESTED_BY}${user.id}`,
      )) === 'true'
    ) {
      throw new HttpException(
        'Password change has been requested already',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.cacheManager.set(
      `${process.env.PASSWORD_CHANGE_TOKEN_PREFIX}${passwordResetToken}`,
      user.id,
      {
        ttl: Number(process.env.CHANGE_PASSWORD_PENDING_TTL_SEC),
      },
    );
    await this.cacheManager.set(
      `${process.env.PASSWORD_CHANGE_TOKEN_PREFIX_REQUESTED_BY}${user.id}`,
      'true',
      {
        ttl: Number(process.env.CHANGE_PASSWORD_PENDING_TTL_SEC) * 2,
      },
    );
  }

  async getUserByPasswordResetToken(
    passwordResetToken: string,
  ): Promise<string> {
    return await this.cacheManager.get(
      `${process.env.PASSWORD_CHANGE_TOKEN_PREFIX}${passwordResetToken}`,
    );
  }
}
