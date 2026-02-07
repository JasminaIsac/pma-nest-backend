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
import { TaskPriority } from 'src/generated/prisma/client';
import { UUIDv4Property } from 'src/modules/auth/decorators/uuidv4property.decorator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Authentification with JWT', minLength: 3, maxLength: 200 })
  @IsString({ message: 'Task name must be text' })
  @IsNotEmpty({ message: 'Task name is required' })
  @MinLength(3, { message: 'Task name must be at least 3 characters long' })
  @MaxLength(200, { message: 'Task name must not exceed 200 characters' })
  name: string;

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
}
