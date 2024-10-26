import { IsEmail, IsNotEmpty } from 'class-validator';

export class MagicLinkDto {
  @IsNotEmpty()
  @IsEmail()
  destination: string;
}
