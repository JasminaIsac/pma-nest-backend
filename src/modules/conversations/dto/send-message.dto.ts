import { IsString, MinLength } from 'class-validator';
import { UUIDv4Property } from 'src/modules/auth/decorators/uuidv4property.decorator';

export class SendMessageDto {
  @UUIDv4Property()
  conversationId: string;

  @UUIDv4Property()
  senderId: string;

  @IsString()
  @MinLength(1)
  message: string;
}
