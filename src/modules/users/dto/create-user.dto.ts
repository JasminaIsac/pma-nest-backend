import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/generated/prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'The email must be valid' })
  @IsNotEmpty({ message: 'The email is required' })
  email: string;

  @ApiProperty({ example: 'John Doe', minLength: 3, maxLength: 100 })
  @IsString({ message: 'The name must be a string' })
  @IsNotEmpty({ message: 'The name is required' })
  @MinLength(3, { message: 'The name must be at least 3 characters long' })
  @MaxLength(100, { message: 'The name must not exceed 100 characters' })
  name: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString({ message: 'The password must be a string' })
  @IsNotEmpty({ message: 'The password is required' })
  @MinLength(6, { message: 'The password must be at least 6 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'The password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({ example: 'developer', enum: UserRole, default: UserRole.DEVELOPER })
  @IsString({ message: 'The role must be a string' })
  @IsNotEmpty({ message: 'The role is required' })
  @IsEnum(UserRole, { message: `The role must be one of the following: ${Object.values(UserRole).join(', ')}` })
  role: UserRole;

  @ApiProperty({ example: '+40712345678' })
  @IsString({ message: 'The phone number must be a string' })
  @IsNotEmpty({ message: 'The phone number is required' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'The phone number must be in a valid format (e.g., +40712345678)',
  })
  tel: string;

  @ApiProperty({ example: 'New York', required: false, maxLength: 255 })
  @IsString({ message: 'The location must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'The location must not exceed 255 characters' })
  location?: string | null;
}
