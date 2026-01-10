import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldPassword123' })
  @IsString({ message: 'Parola veche trebuie să fie text' })
  @IsNotEmpty({ message: 'Parola veche este obligatorie' })
  oldPassword: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString({ message: 'Noua parolă trebuie să fie text' })
  @IsNotEmpty({ message: 'Noua parolă este obligatorie' })
  @MinLength(6, { message: 'Noua parolă trebuie să aibă cel puțin 6 caractere' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Parola trebuie să conțină cel puțin o literă mare, o literă mică și o cifră',
  })
  newPassword: string;
}
