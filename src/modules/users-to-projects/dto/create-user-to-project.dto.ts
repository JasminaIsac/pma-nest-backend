import {
  IsInt,
  IsPositive,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserToProjectDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: 'ID-ul proiectului trebuie să fie un număr întreg' })
  @IsPositive({ message: 'ID-ul proiectului trebuie să fie pozitiv' })
  @IsNotEmpty({ message: 'ID-ul proiectului este obligatoriu' })
  project_id: number;

  @ApiProperty({ example: 2 })
  @IsInt({ message: 'ID-ul utilizatorului trebuie să fie un număr întreg' })
  @IsPositive({ message: 'ID-ul utilizatorului trebuie să fie pozitiv' })
  @IsNotEmpty({ message: 'ID-ul utilizatorului este obligatoriu' })
  user_id: number;

  @ApiProperty({ example: 'developer', enum: ['root', 'admin', 'project_manager', 'developer'], default: 'developer' })
  @IsEnum(['root', 'admin', 'project_manager', 'developer'], { 
    message: 'Rolul trebuie să fie: root, admin, project_manager sau developer' 
  })
  @IsNotEmpty({ message: 'Rolul este obligatoriu' })
  user_role: UserRole;
}
