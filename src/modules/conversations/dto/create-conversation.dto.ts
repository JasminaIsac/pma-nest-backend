import {
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsPositive,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConversationType } from 'src/generated/prisma/client';

export class CreateConversationDto {
  @ApiProperty({ example: 'private', enum: ConversationType, description: 'Type of the conversation' })
  @IsEnum(ConversationType, { message: `The conversation type must be one of the following: ${Object.values(ConversationType).join(', ')}` })
  @IsNotEmpty({ message: 'Conversation type is required' })
  type: ConversationType;

  @ApiProperty({ example: [2, 3], description: 'List of participant IDs' })
  @IsArray({ message: 'Participant IDs must be an array' })
  @ArrayMinSize(1, { message: 'At least one participant ID is required' })
  @IsInt({ each: true, message: 'Each participant ID must be an integer' })
  @IsPositive({ each: true, message: 'Each participant ID must be a positive integer' })
  @IsNotEmpty({ message: 'Participant IDs are required' })
  participantIds: number[];
}
