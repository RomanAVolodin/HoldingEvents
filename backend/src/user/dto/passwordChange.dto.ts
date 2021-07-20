import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';
import { Match } from '@app/share/decorators/match.decorator';

export class PasswordChangeDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsNotEmpty()
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak',
  })
  @MinLength(6, { message: 'Password minimal length should be 6 simbols' })
  readonly password: string;

  @IsNotEmpty()
  @Match('password', { message: 'Passwords should match each other' })
  readonly passwordRepeat: string;

  @IsNotEmpty()
  @IsUUID()
  readonly hash: string;
}
