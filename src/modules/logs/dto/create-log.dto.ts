import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsEnum, IsPositive } from 'class-validator';
import { LogAction, LogEntity } from 'src/generated/prisma/client';

export class CreateLogDto {
  @ApiProperty()
  @IsNumber({}, { message: 'User ID must be a number' })
  @IsNotEmpty({ message: 'User ID is required' })
  @IsPositive({ message: 'User ID must be positive' })
  userId: number;

  @ApiProperty({ example: 'Project', enum: LogEntity })
  @IsNotEmpty({ message: 'Entity is required' })
  @IsEnum(LogEntity, { message: `Entity must be one of the following: ${Object.values(LogEntity).join(', ')}` })
  entity: LogEntity;

  @ApiProperty( { example: 1, required: false })
  @IsNumber({}, { message: 'Entity ID must be a number' })
  entityId?: number | null;

  @ApiProperty({ example: 'CREATE', enum: LogAction })
  @IsNotEmpty({ message: 'Action is required' })
  @IsEnum(LogAction, { message: `Action must be one of the following: ${Object.values(LogAction).join(', ')}` })
  action: LogAction;

  @ApiProperty({ required: false })
  before?: unknown;
  @ApiProperty({ required: false })
  after?: unknown;
}
