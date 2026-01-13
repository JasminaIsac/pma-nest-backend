import { IsInt } from 'class-validator';

export class JoinConversationDto {
  @IsInt()
  conversationId: number;
}