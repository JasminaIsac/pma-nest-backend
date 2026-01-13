import { IsInt, IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsInt()
  conversationId: number;

  @IsInt()
  senderId: number;

  @IsString()
  @MinLength(1)
  message: string;
}
