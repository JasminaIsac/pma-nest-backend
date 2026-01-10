import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Email-ul trebuie să fie valid' })
  @IsNotEmpty({ message: 'Email-ul este obligatoriu' })
  email: string;

  @ApiProperty({ example: 'John Doe', minLength: 3, maxLength: 100 })
  @IsString({ message: 'Numele trebuie să fie text' })
  @IsNotEmpty({ message: 'Numele este obligatoriu' })
  @MinLength(3, { message: 'Numele trebuie să aibă cel puțin 3 caractere' })
  @MaxLength(100, { message: 'Numele nu poate depăși 100 caractere' })
  name: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString({ message: 'Parola trebuie să fie text' })
  @IsNotEmpty({ message: 'Parola este obligatorie' })
  @MinLength(6, { message: 'Parola trebuie să aibă cel puțin 6 caractere' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Parola trebuie să conțină cel puțin o literă mare, o literă mică și o cifră',
  })
  password: string;

  @ApiProperty({ example: 'developer', enum: ['root', 'admin', 'project_manager', 'developer'] })
  @IsString({ message: 'Rolul trebuie să fie text' })
  @IsNotEmpty({ message: 'Rolul este obligatoriu' })
  @Matches(/^(root|admin|project_manager|developer)$/, {
    message: 'Rolul trebuie să fie: root, admin, project_manager sau developer',
  })
  role: UserRole;

  @ApiProperty({ example: '+40712345678' })
  @IsString({ message: 'Telefonul trebuie să fie text' })
  @IsNotEmpty({ message: 'Telefonul este obligatoriu' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Telefonul trebuie să fie în format valid (ex: +40712345678)',
  })
  tel: string;

  @ApiProperty({ example: 'New York', required: false, maxLength: 100 })
  @IsString({ message: 'Locația trebuie să fie text' })
  @IsOptional()
  @MaxLength(100, { message: 'Locația nu poate depăși 100 caractere' })
  location?: string | null;
}
