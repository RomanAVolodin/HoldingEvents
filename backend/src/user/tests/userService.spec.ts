import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '@app/user/user.service';
import { UserRepository } from '@app/user/repositories/user.repository';
import { NotificationService } from '@app/notification/notification.service';
import { CachingService } from '@app/caching/caching.service';
import { UserEntity } from '@app/user/entity/user.entity';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UserStatusEnum } from '@app/user/types/user-status.enum';
import { RegisterUserDto } from '@app/user/dto/registerUser.dto';
import { ERole } from '@app/user/entity/role.enum';

const registerUserDto: RegisterUserDto = {
  email: 'email@ru.ru',
  password: '123',
  lastName: 'Ivanov',
};

class UserRepositoryMock {
  findByEmail: (email: string) => Promise<UserEntity | null> = jest.fn();
  remove: (user: UserEntity) => Promise<UserEntity> = jest.fn();
  save: (user: UserEntity) => Promise<UserEntity> = jest
    .fn()
    .mockImplementation(() => registerUserDto);
}
class NotificationServiceMock {}
class CachingServiceMock {}

describe('UserService', () => {
  let userService: UserService;
  let userRepository: UserRepository;
  let cachingService: CachingService;
  let notificationService: NotificationService;

  beforeEach(async () => {
    const UserRepositoryProvider = {
      provide: UserRepository,
      useClass: UserRepositoryMock,
    };
    const NotificationServiceProvider = {
      provide: NotificationService,
      useClass: NotificationServiceMock,
    };
    const CachingServiceProvider = {
      provide: CachingService,
      useClass: CachingServiceMock,
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        UserRepositoryProvider,
        NotificationServiceProvider,
        CachingServiceProvider,
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
    cachingService = module.get<CachingService>(CachingService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  it('service should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('User registration process', () => {
    it('should throw exception, email already taken and status active', async () => {
      userRepository.findByEmail = jest.fn().mockImplementation(() => ({
        id: '1212',
        status: UserStatusEnum.Active,
      })) as (email: string) => Promise<UserEntity | null>;

      try {
        await userService.registerUser(registerUserDto);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
      }
    });

    it('should throw exception, email already taken and status disabled', async () => {
      userRepository.findByEmail = jest.fn().mockImplementation(() => ({
        id: '1212',
        status: UserStatusEnum.Disabled,
      })) as (email: string) => Promise<UserEntity | null>;

      try {
        await userService.registerUser(registerUserDto);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.message).toBe('Email has been already taken.');
      }
    });

    it('should throw exception, confirmation email has been already sent', async () => {
      userRepository.findByEmail = jest.fn().mockImplementation(() => ({
        id: '1212',
        status: UserStatusEnum.Pending,
      })) as (email: string) => Promise<UserEntity | null>;
      cachingService.checkIfUserStillPendingEmailConfirmation = jest
        .fn()
        .mockImplementation(async () => true) as (
        user: UserEntity,
      ) => Promise<boolean>;

      try {
        await userService.registerUser(registerUserDto);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.message).toBe(
          'Confirmation email already has been sent. Try later.',
        );
      }
    });

    it('should create and return user', async () => {
      userRepository.findByEmail = jest.fn().mockImplementation(() => ({
        id: '1212',
        status: UserStatusEnum.Pending,
      }));
      cachingService.checkIfUserStillPendingEmailConfirmation = jest.fn();
      notificationService.sendUserConfirmation = jest.fn();

      const user = await userService.registerUser(registerUserDto);
      expect(userRepository.findByEmail).toBeCalledTimes(1);
      expect(
        cachingService.checkIfUserStillPendingEmailConfirmation,
      ).toBeCalledTimes(1);
      expect(notificationService.sendUserConfirmation).toBeCalledTimes(1);
      expect(user).toBeDefined();
      expect(user.role).toBe(ERole[user.role]);
      expect(user['password']).toBeUndefined();
    });
  });
});
