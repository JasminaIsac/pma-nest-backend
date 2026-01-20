import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UUIDv4Property } from 'src/modules/auth/decorators/uuidv4property.decorator';

export class CreateMessageDto {
  @UUIDv4Property()
  conversationId: string;

  @ApiProperty({ example: 'Hello, how can I help you?', description: 'Message content' })
  @IsString({ message: 'The message must be text' })
  @IsNotEmpty({ message: 'The message is required' })
  @MinLength(1, { message: 'The message must be at least 1 character long' })
  @MaxLength(5000, { message: 'The message must be at most 5000 characters long' })
  message: string;
}
