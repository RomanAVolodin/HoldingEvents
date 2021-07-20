import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@app/user/entity/user.entity';
import { UserRepository } from '@app/user/repositories/user.repository';
import { NotificationModule } from '@app/notification/notification.module';
import { CachingModule } from '@app/caching/caching.module';
import { AuthGuard } from '@app/user/guards/auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    NotificationModule,
    CachingModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository, AuthGuard],
  exports: [UserRepository],
})
export class UserModule {}
