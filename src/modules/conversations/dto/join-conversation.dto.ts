import { UUIDv4Property } from 'src/modules/auth/decorators/uuidv4property.decorator';

export class JoinConversationDto {
  @UUIDv4Property()
  conversationId: string;
}