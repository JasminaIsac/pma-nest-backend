import { IsNotEmpty, IsEnum, IsArray, ArrayMinSize, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConversationType } from 'src/generated/prisma/client';

export class CreateConversationDto {
  @ApiProperty({ example: 'private', enum: ConversationType, description: 'Type of the conversation' })
  @IsEnum(ConversationType, { message: `The conversation type must be one of the following: ${Object.values(ConversationType).join(', ')}` })
  @IsNotEmpty({ message: 'Conversation type is required' })
  type: ConversationType;

  @ApiProperty({ example: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'], description: 'List of participant IDs' })
  @IsArray({ message: 'Participant IDs must be an array' })
  @ArrayMinSize(1, { message: 'At least one participant ID is required' })
  @IsNotEmpty({ message: 'Participant IDs are required' })
  participantIds: string[];

  @ApiProperty({ example: 'My group', required: false, description: 'Name of the conversation' })
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name?: string;
}
