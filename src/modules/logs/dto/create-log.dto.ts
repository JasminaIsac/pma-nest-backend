import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { LogAction, LogEntity } from 'src/generated/prisma/client';
import { UUIDv4Property } from 'src/modules/auth/decorators/uuidv4property.decorator';

export class CreateLogDto {
  @UUIDv4Property()
  userId: string;

  @ApiProperty({ example: 'Project', enum: LogEntity })
  @IsNotEmpty({ message: 'Entity is required' })
  @IsEnum(LogEntity, { message: `Entity must be one of the following: ${Object.values(LogEntity).join(', ')}` })
  entity: LogEntity;

  @UUIDv4Property({ required: false })
  entityId?: string | null;

  @ApiProperty({ example: 'CREATE', enum: LogAction })
  @IsNotEmpty({ message: 'Action is required' })
  @IsEnum(LogAction, { message: `Action must be one of the following: ${Object.values(LogAction).join(', ')}` })
  action: LogAction;

  @ApiProperty({ required: false })
  before?: unknown;

  @ApiProperty({ required: false })
  after?: unknown;
}
