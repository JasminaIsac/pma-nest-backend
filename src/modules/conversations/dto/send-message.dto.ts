import { IsArray, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { UUIDv4Property } from 'src/common/decorators/uuidv4property.decorator';

export class SendMessageDto {
  @UUIDv4Property()
  conversationId: string;

  @UUIDv4Property()
  senderId: string;

  // message poate fi gol dacă există attachments
  @ValidateIf((o) => !o.attachmentIds || o.attachmentIds.length === 0)
  @IsString()
  message: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  attachmentIds?: string[];

  @IsOptional()
  @IsString()
  mentionsData?: string;
}
