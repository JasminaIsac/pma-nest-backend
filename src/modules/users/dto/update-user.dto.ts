import { PartialType, ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UserStatus } from 'src/generated/prisma/enums';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ example: 'ACTIVE', enum: UserStatus, default: UserStatus.ACTIVE })
  @IsEnum(UserStatus, { message: 'Status must be: new, in progress, paused, to check or completed' })
  status: UserStatus;
}
