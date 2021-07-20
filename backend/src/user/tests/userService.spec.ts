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
import { hash } from 'bcrypt';
import { UserTokensDto } from '@app/user/dto/userTokens.dto';
import { ConfigModule } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { log } from 'util';
import { register } from 'tsconfig-paths';

let registerUserDto: RegisterUserDto;
const user: Omit<UserEntity, 'hashPassword'> = {
  id: uuidv4(),
  email: 'mail@mail.ru',
  status: UserStatusEnum.Active,
  profile: {
    firstName: 'Roman',
    lastName: '',
    image: '',
  },
  role: ERole.User,
  password: '$2a$10$hvqEVeB3rCBWzhILkTann.qDmGeO34PDkKuUVMRAUmdBShLG9A8AC', //123
  created_at: new Date(),
  updated_at: new Date(),
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
      imports: [
        ConfigModule.forRoot({
          envFilePath: '../.env',
        }),
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
    cachingService = module.get<CachingService>(CachingService);
    notificationService = module.get<NotificationService>(NotificationService);

    registerUserDto = {
      email: 'email@ru.ru',
      password: '123',
      lastName: 'Ivanov',
    };
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

  describe('User logging in process', () => {
    it('should throw exception - user does not exist', async () => {
      userRepository.findByEmailForLogin = jest.fn();
      try {
        await userService.login(registerUserDto);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.message).toBe('User doesnt exist');
      }
    });

    it('should throw exception - рassword is not valid', async () => {
      const hashedPassword = await hash(registerUserDto.password + '_test', 10);
      userRepository.findByEmailForLogin = jest.fn().mockImplementation(() => {
        return {
          ...registerUserDto,
          password: hashedPassword,
        };
      });

      try {
        await userService.login(registerUserDto);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.message).toBe('Invalid password');
      }
    });

    it('should throw exception - user is not activated yet', async () => {
      const hashedPassword = await hash(registerUserDto.password, 10);
      userRepository.findByEmailForLogin = jest.fn().mockImplementation(() => {
        return {
          ...registerUserDto,
          password: hashedPassword,
          status: UserStatusEnum.Pending,
        };
      });

      try {
        await userService.login(registerUserDto);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.message).toBe('User was not activated yet');
      }
    });

    it('should throw exception - user is disabled', async () => {
      const hashedPassword = await hash(registerUserDto.password, 10);
      userRepository.findByEmailForLogin = jest.fn().mockImplementation(() => {
        return {
          ...registerUserDto,
          password: hashedPassword,
          status: UserStatusEnum.Disabled,
        };
      });

      try {
        await userService.login(registerUserDto);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.message).toBe('User is disabled at the moment');
      }
    });

    it('should log user in', async () => {
      const hashedPassword = await hash(registerUserDto.password, 10);
      userRepository.findByEmailForLogin = jest.fn().mockImplementation(() => {
        return {
          ...registerUserDto,
          password: hashedPassword,
          status: UserStatusEnum.Active,
        };
      });

      const tokens: UserTokensDto = await userService.login(registerUserDto);
      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
    });
  });

  describe('Confirm registration token', () => {
    it('should throw exception if token is not valid', async () => {
      cachingService.getUserByConfirmationToken = jest
        .fn()
        .mockImplementation(() => null);
      userRepository.getById = jest.fn();
      try {
        await userService.confirmToken({ token: 'wrongtoken' });
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.message).toBe('Token is not valid');
      }
    });

    it('should throw exception if user already activated', async () => {
      cachingService.getUserByConfirmationToken = jest
        .fn()
        .mockImplementation(() => user.id);
      userRepository.getById = jest.fn().mockImplementation(() => ({
        ...user,
        status: UserStatusEnum.Active,
      }));

      try {
        await userService.confirmToken({ token: 'sometoken' });
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.message).toBe('User has been already activated');
      }
    });

    it('should return tokens if all ok', async () => {
      cachingService.getUserByConfirmationToken = jest
        .fn()
        .mockImplementation(() => user.id);
      userRepository.getById = jest.fn().mockImplementation(() => ({
        ...user,
        status: UserStatusEnum.Pending,
      }));

      const tokens = await userService.confirmToken({ token: 'sometoken' });
      expect(userRepository.save).toBeCalledTimes(1);
      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
    });
  });

  describe('Refresh tokens', () => {
    it('should throw exception if no token provided', async () => {
      try {
        await userService.refreshTokens('');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.message).toBe('Token must be provided');
      }
    });

    it('should generate new tokens if all is ok', async () => {
      const hashedPassword = await hash(registerUserDto.password, 10);
      userRepository.findByEmailForLogin = jest.fn().mockImplementation(() => {
        return {
          ...registerUserDto,
          password: hashedPassword,
          status: UserStatusEnum.Active,
        };
      });
      userRepository.getById = jest
        .fn()
        .mockImplementation(() => registerUserDto);
      const tokens: UserTokensDto = await userService.login(registerUserDto);
      const newTokens = await userService.refreshTokens(tokens.refreshToken);
      expect(newTokens).toBeDefined();
      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).toBeDefined();
    });

    it('should throw exception if token is not valid', async () => {
      try {
        await userService.refreshTokens('notvalidtoken');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.message).toBe('jwt malformed');
      }
    });
  });
});
