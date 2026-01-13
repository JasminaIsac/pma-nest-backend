import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus } from 'src/generated/prisma/enums';

export class CreateProjectDto {
  @ApiProperty({ example: 'Project Alpha', minLength: 3, maxLength: 255 })
  @IsString({ message: 'Project name must be a string' })
  @IsNotEmpty({ message: 'Project name is required' })
  @MinLength(3, { message: 'Project name must be at least 3 characters long' })
  @MaxLength(255, { message: 'Project name cannot exceed 255 characters' })
  name: string;

  @ApiProperty({ example: 'This is a sample project', required: false, maxLength: 1000 })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsNumber({}, { message: 'Category ID must be a number' })
  @IsNotEmpty({ message: 'Category ID is required' })
  @Min(1, { message: 'Category ID must be greater than 0' })
  categoryId: number;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsNumber({}, { message: 'Manager ID must be a number' })
  @IsNotEmpty({ message: 'Manager ID is required' })
  @Min(1, { message: 'Manager ID must be greater than 0' })
  managerId: number;
  
  @ApiProperty({ example: 'ACTIVE', enum: ProjectStatus, default: ProjectStatus.NEW })
  @IsString({ message: 'Status must be a string' })
  @IsNotEmpty({ message: 'Status is required' })
  @MinLength(3, { message: 'Status must be at least 3 characters long' })
  @MaxLength(50, { message: 'Status cannot exceed 50 characters' })
  @IsEnum(ProjectStatus, { message: `Status must be one of the following: ${Object.values(ProjectStatus).join(', ')}` })
  status: ProjectStatus;
  
  @ApiProperty({ example: '2025-12-31T23:59:59Z', required: false })
  @IsOptional()
  @IsDateString({}, { message: 'Deadline must be a valid ISO 8601 date string' })
  deadline?: string;
}
