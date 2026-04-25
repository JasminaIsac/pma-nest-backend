import { UUIDv4Property } from 'src/common/decorators/uuidv4property.decorator';

export class JoinConversationDto {
  @UUIDv4Property()
  conversationId: string;
}