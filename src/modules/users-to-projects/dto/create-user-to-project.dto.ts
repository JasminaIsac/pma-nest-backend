import {
  IsInt,
  IsPositive,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/generated/prisma/enums';

export class CreateUserToProjectDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: 'ID must be an integer' })
  @IsPositive({ message: 'Project ID must be positive' })
  @IsNotEmpty({ message: 'Project ID is required' })
  projectId: number;

  @ApiProperty({ example: 2 })
  @IsInt({ message: 'User ID must be an integer' })
  @IsPositive({ message: 'User ID must be positive' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: number;

  @ApiProperty({ example: 'developer', enum: UserRole, default: UserRole.DEVELOPER })
  @IsEnum(UserRole, { message: `Role must be one of the following: ${Object.values(UserRole).join(', ')}` })
  @IsNotEmpty({ message: 'Role is required' })
  userRole: UserRole;
}
