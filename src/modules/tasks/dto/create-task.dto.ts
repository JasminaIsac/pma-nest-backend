import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  IsISO8601,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from 'src/generated/prisma/client';
import { UUIDv4Property } from 'src/modules/auth/decorators/uuidv4property.decorator';

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

  @UUIDv4Property()
  projectId: string;

  @ApiProperty({ example: 'high', enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsEnum(TaskPriority, { message: `Priority must be one of the following: ${Object.values(TaskPriority).join(', ')}` })
  priority: TaskPriority;

  @UUIDv4Property()
  assignedTo: string;

  @ApiProperty({ example: '2026-02-15T10:00:00Z' })
  @IsISO8601({ strict: true }, { message: 'Deadline must be in ISO8601 format' })
  @IsNotEmpty({ message: 'Deadline is required' })
  deadline: string;

  @ApiProperty({ example: 'new', enum: TaskStatus, default: TaskStatus.NEW })
  @IsEnum(TaskStatus, { message: 'Status must be: new, in progress, paused, to check or completed' })
  status: TaskStatus;
}
