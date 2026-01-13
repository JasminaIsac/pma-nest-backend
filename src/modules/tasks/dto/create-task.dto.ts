import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  IsInt,
  IsPositive,
  IsISO8601,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from 'src/generated/prisma/client';

export class CreateTaskDto {
  @ApiProperty({ example: 'Authentification with JWT', minLength: 3, maxLength: 200 })
  @IsString({ message: 'Title must be text' })
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title: string;

  @ApiProperty({ example: 'Implementarea sistemului de autentificare cu JWT', required: false, maxLength: 1000 })
  @IsString({ message: 'Description must be text' })
  @IsOptional()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'Project ID must be an integer' })
  @IsPositive({ message: 'Project ID must be positive' })
  @IsNotEmpty({ message: 'Project ID is required' })
  projectId: number;

  @ApiProperty({ example: 'high', enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsEnum(TaskPriority, { message: `Priority must be one of the following: ${Object.values(TaskPriority).join(', ')}` })
  priority: TaskPriority;

  @ApiProperty({ example: 2 })
  @IsInt({ message: 'User ID must be an integer' })
  @IsPositive({ message: 'User ID must be positive' })
  @IsNotEmpty({ message: 'User ID is required' })
  assignedTo: number;

  @ApiProperty({ example: '2026-02-15T10:00:00Z' })
  @IsISO8601({ strict: true }, { message: 'Deadline must be in ISO8601 format' })
  @IsNotEmpty({ message: 'Deadline is required' })
  deadline: string;

  @ApiProperty({ example: 'new', enum: TaskStatus, default: TaskStatus.NEW })
  @IsEnum(TaskStatus, { message: 'Status must be: new, in progress, paused, to check or completed' })
  status: TaskStatus;
}
