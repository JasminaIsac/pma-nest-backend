import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Email-ul trebuie să fie valid' })
  @IsNotEmpty({ message: 'Email-ul este obligatoriu' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString({ message: 'Parola trebuie să fie text' })
  @IsNotEmpty({ message: 'Parola este obligatorie' })
  password: string;
}
