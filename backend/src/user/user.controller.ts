import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { RegisterUserDto } from '@app/user/dto/registerUser.dto';
import { UserService } from '@app/user/user.service';
import { BackendValidationPipe } from '@app/share/pipes/backendValidation.pipe';
import { EmailConfirmDto } from '@app/user/dto/emailConfirm.dto';
import { IUserResponseInterface } from '@app/user/types/userResponse.interface';
import { UserTokensDto } from '@app/user/dto/userTokens.dto';
import { LoginUserDto } from '@app/user/dto/loginUser.dto';
import { ResetPasswordDto } from '@app/user/dto/resetPassword.dto';
import { PasswordChangeDto } from '@app/user/dto/passwordChange.dto';
import { UserEntity } from '@app/user/entity/user.entity';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { User } from '@app/user/decorators/user.decorator';
import { Roles } from '@app/user/decorators/roles.decorator';
import { ERole } from '@app/user/entity/role.enum';
import { Pagination } from 'nestjs-typeorm-paginate';
import { UserRepository } from '@app/user/repositories/user.repository';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly usersRepository: UserRepository,
  ) {}

  @Post('/register')
  @UsePipes(new BackendValidationPipe())
  async register(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<IUserResponseInterface> {
    return await this.userService.registerUser(registerUserDto);
  }

  @Get('/confirm-email')
  @UsePipes(new BackendValidationPipe())
  async confirmEmail(
    @Query() emailConfirmDto: EmailConfirmDto,
  ): Promise<UserTokensDto> {
    return await this.userService.confirmToken(emailConfirmDto);
  }

  @Post('/login')
  @UsePipes(new BackendValidationPipe())
  async login(@Body() dto: LoginUserDto): Promise<UserTokensDto> {
    return await this.userService.login(dto);
  }

  @Get('/refresh')
  async refresh(@Query('token') token: string): Promise<UserTokensDto> {
    return await this.userService.refreshTokens(token);
  }

  @HttpCode(HttpStatus.ACCEPTED)
  @Post('/reset-password-request')
  @UsePipes(new BackendValidationPipe())
  async passwordResetRequest(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.userService.processPasswordResetRequest(dto);
  }

  @HttpCode(HttpStatus.ACCEPTED)
  @Post('/reset-password')
  @UsePipes(new BackendValidationPipe())
  async resetPassword(
    @Body() dto: PasswordChangeDto,
  ): Promise<IUserResponseInterface> {
    return await this.userService.changePassword(dto);
  }

  @Get('/profile')
  @UseGuards(AuthGuard)
  async usersProfile(
    @User() currentUser: UserEntity,
  ): Promise<IUserResponseInterface> {
    return this.userService.buildUserResponse(currentUser);
  }

  @Get('/all')
  @Roles(ERole.Admin, ERole.Moderator)
  @UseGuards(AuthGuard)
  async getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<Pagination<IUserResponseInterface>> {
    limit = limit > 100 ? 100 : limit;
    return this.userService.paginate({
      page,
      limit,
      route: `${process.env.FRONTEND_HOST}/users/all`,
    });
  }
}
