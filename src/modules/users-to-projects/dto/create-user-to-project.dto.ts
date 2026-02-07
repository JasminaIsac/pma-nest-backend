import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/generated/prisma/enums';
import { UUIDv4Property } from 'src/modules/auth/decorators/uuidv4property.decorator';

export class CreateUserToProjectDto {
  @UUIDv4Property()
  projectId: string;

  @UUIDv4Property()
  userId: string;

  @ApiProperty({ example: 'developer', enum: UserRole, default: UserRole.DEVELOPER })
  @IsEnum(UserRole, { message: `Role must be one of the following: ${Object.values(UserRole)
      .map(role => role.toLowerCase())
      .join(', ')}`, })
  @IsNotEmpty({ message: 'Role is required' })
  userRole: UserRole;
}
