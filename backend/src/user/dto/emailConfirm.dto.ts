import { IsNotEmpty, IsUUID } from 'class-validator';

export class EmailConfirmDto {
  @IsNotEmpty()
  @IsUUID()
  readonly token: string;
}
