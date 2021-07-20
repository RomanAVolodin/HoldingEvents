import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak',
  })
  @MinLength(6, { message: 'Password minimal length should be 6 simbols' })
  readonly password: string;

  @IsNotEmpty()
  readonly lastName: string;

  readonly firstName?: string;
}
