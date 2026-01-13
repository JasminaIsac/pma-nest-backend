import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsPositive,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ example: 1, description: 'Conversation ID' })
  @IsInt({ message: 'The conversation ID must be an integer' })
  @IsPositive({ message: 'The conversation ID must be a positive integer' })
  @IsNotEmpty({ message: 'The conversation ID is required' })
  conversationId: number;

  @ApiProperty({ example: 'Hello, how can I help you?', description: 'Message content' })
  @IsString({ message: 'The message must be text' })
  @IsNotEmpty({ message: 'The message is required' })
  @MinLength(1, { message: 'The message must be at least 1 character long' })
  @MaxLength(5000, { message: 'The message must be at most 5000 characters long' })
  message: string;
}
