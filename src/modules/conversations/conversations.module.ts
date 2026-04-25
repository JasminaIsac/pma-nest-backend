import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { MessagesService } from './messages.service';
import { ConversationsController } from './conversations.controller';
import { MessagesController } from './messages.controller';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { EncryptionService } from './services/encryption.service';
import { ConversationsGateway } from './gateways/conversations.gateway';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30d' },
    }),
    CommonModule,
  ],
  controllers: [ConversationsController, MessagesController, AttachmentsController],
  providers: [ConversationsService, MessagesService, EncryptionService, ConversationsGateway, AttachmentsService],
  exports: [ConversationsService, MessagesService, EncryptionService],
})
export class ConversationsModule {}
