import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from 'src/generated/prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiProperty({ example: 'NEW', enum: TaskStatus, default: TaskStatus.NEW })
  @IsEnum(TaskStatus, { message: 'Status must be: new, in progress, paused, to check or completed' })
  status: TaskStatus;
}
