import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RegisterUserDto } from '@app/user/dto/registerUser.dto';
import { UserRepository } from '@app/user/repositories/user.repository';
import { UserEntity } from '@app/user/entity/user.entity';
import { IUserResponseInterface } from '@app/user/types/userResponse.interface';
import { Profile } from '@app/user/entity/profile';
import { NotificationService } from '@app/notification/notification.service';
import { EmailConfirmDto } from '@app/user/dto/emailConfirm.dto';
import { UserTokensDto } from '@app/user/dto/userTokens.dto';
import { CachingService } from '@app/caching/caching.service';
import { UserStatusEnum } from '@app/user/types/user-status.enum';
import { sign, verify } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { LoginUserDto } from '@app/user/dto/loginUser.dto';
import { compare, hash } from 'bcrypt';
import { ResetPasswordDto } from '@app/user/dto/resetPassword.dto';
import { PasswordChangeDto } from '@app/user/dto/passwordChange.dto';
import { ERole } from '@app/user/entity/role.enum';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly notificationService: NotificationService,
    private readonly cachingService: CachingService,
  ) {}

  async registerUser(
    registerUserDto: RegisterUserDto,
  ): Promise<IUserResponseInterface> {
    const userByEmail = await this.userRepository.findByEmail(
      registerUserDto.email,
    );

    if (userByEmail && userByEmail.status !== UserStatusEnum.Pending) {
      throw new HttpException(
        'Email has been already taken.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (
      userByEmail &&
      (await this.cachingService.checkIfUserStillPendingEmailConfirmation(
        userByEmail,
      ))
    ) {
      throw new HttpException(
        'Confirmation email already has been sent. Try later.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (userByEmail) {
      await this.userRepository.remove(userByEmail);
    }

    const user = new UserEntity();
    user.email = registerUserDto.email;
    user.password = registerUserDto.password;
    user.profile = new Profile(registerUserDto);
    user.role = ERole.User;
    const userEntity = await this.userRepository.save(user);

    await this.notificationService.sendUserConfirmation(userEntity);
    return this.buildUserResponse(userEntity);
  }

  buildUserResponse(user: UserEntity): IUserResponseInterface {
    delete user.password;
    return {
      ...user,
      role: ERole[user.role],
    };
  }

  async confirmToken(emailconfirmDto: EmailConfirmDto): Promise<UserTokensDto> {
    const user_id = (await this.cachingService.getUserByConfirmationToken(
      emailconfirmDto.token,
    )) as string;
    const user = await this.userRepository.getById(user_id);
    if (!user_id || !user) {
      throw new HttpException('Token is not valid', HttpStatus.UNAUTHORIZED);
    }

    if (user.status !== UserStatusEnum.Pending) {
      throw new HttpException(
        'User has been already activated',
        HttpStatus.FORBIDDEN,
      );
    }

    user.status = UserStatusEnum.Active;
    await this.userRepository.save(user);

    return new UserTokensDto(
      UserService.generateJwt(user),
      UserService.generateRefreshJwt(user),
    );
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.userRepository.findByEmailForLogin(
      loginUserDto.email,
    );
    if (!user) {
      throw new HttpException(
        'User doesnt exist',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const isPasswordValid = await compare(loginUserDto.password, user.password);
    if (!isPasswordValid) {
      throw new HttpException(
        'Invalid password',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    switch (user.status) {
      case UserStatusEnum.Pending:
        throw new HttpException(
          'User was not activated yet',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      case UserStatusEnum.Disabled:
        throw new HttpException(
          'User is disabled at the moment',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
    }

    return new UserTokensDto(
      UserService.generateJwt(user),
      UserService.generateRefreshJwt(user),
    );
  }

  private static generateJwt(user: UserEntity): string {
    return sign(
      {
        id: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        jti: uuidv4(),
      },
      process.env.JWT_SECRET,
    );
  }

  private static generateRefreshJwt(user: UserEntity): string {
    return sign(
      {
        id: user.id,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
        jti: uuidv4(),
      },
      process.env.JWT_SECRET_REFRESH,
    );
  }

  async refreshTokens(token: string): Promise<UserTokensDto> {
    if (!token) {
      throw new HttpException(
        'Token must be provided',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    try {
      const decode = verify(token, process.env.JWT_SECRET_REFRESH);
      const user = await this.userRepository.getById(decode.id);
      return new UserTokensDto(
        UserService.generateJwt(user),
        UserService.generateRefreshJwt(user),
      );
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async processPasswordResetRequest(dto: ResetPasswordDto): Promise<void> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user || user.status !== UserStatusEnum.Active) {
      throw new HttpException(
        'Email does not exist or user is not activated',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.notificationService.sendPasswordResetURL(user);
  }

  async changePassword(
    dto: PasswordChangeDto,
  ): Promise<IUserResponseInterface> {
    const user_id = (await this.cachingService.getUserByPasswordResetToken(
      dto.hash,
    )) as string;
    const user = await this.userRepository.getById(user_id);

    if (!user_id || !user || user.email !== dto.email) {
      throw new HttpException('Token is not valid', HttpStatus.UNAUTHORIZED);
    }

    user.password = await hash(dto.password, 10);
    const updatedUser = await this.userRepository.save(user);
    return this.buildUserResponse(updatedUser);
  }

  async getAllUsers(): Promise<IUserResponseInterface[]> {
    const allUsers = await this.userRepository.getAll();
    return allUsers.map((user) => this.buildUserResponse(user));
  }

  async paginate(
    options: IPaginationOptions,
  ): Promise<Pagination<IUserResponseInterface>> {
    const pagination = await paginate<UserEntity>(
      this.userRepository.repo,
      options,
    );
    const items = pagination.items.map((user) => {
      return this.buildUserResponse(user);
    });
    return { ...pagination, items };
  }
}
