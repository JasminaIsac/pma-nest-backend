import {
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsPositive,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConversationType } from '@prisma/client';

export class CreateConversationDto {
  @ApiProperty({ example: 'private', enum: ['private', 'group'] })
  @IsEnum(['private', 'group'], { message: 'Tipul conversației trebuie să fie: private sau group' })
  @IsNotEmpty({ message: 'Tipul conversației este obligatoriu' })
  type: ConversationType;

  @ApiProperty({ example: [2, 3], description: 'Array de ID-uri ale participanților' })
  @IsArray({ message: 'Participanții trebuie să fie o listă' })
  @ArrayMinSize(1, { message: 'Trebuie să existe cel puțin un participant' })
  @IsInt({ each: true, message: 'Fiecare participant ID trebuie să fie un număr întreg' })
  @IsPositive({ each: true, message: 'ID-ul participantului trebuie să fie pozitiv' })
  @IsNotEmpty({ message: 'Lista participanților este obligatorie' })
  participant_ids: number[];
}
