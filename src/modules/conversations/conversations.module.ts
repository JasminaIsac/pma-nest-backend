import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { MessagesService } from './messages.service';
import { ConversationsController } from './conversations.controller';
import { MessagesController } from './messages.controller';
import { EncryptionService } from './services/encryption.service';
import { ConversationsGateway } from './gateways/conversations.gateway';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [ConversationsController, MessagesController],
  providers: [ConversationsService, MessagesService, EncryptionService, ConversationsGateway],
  exports: [ConversationsService, MessagesService, EncryptionService],
})
export class ConversationsModule {}
