import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'prisma/prisma.service';
import { EncryptionService } from '../services/encryption.service';
import { ConversationMessage, MessageStatus } from 'src/generated/prisma/client';
import { JoinConversationDto } from '../dto/join-conversation.dto';
import { SendMessageDto } from '../dto/send-message.dto';

export interface SendMessageResponse {
  status: 'ok' | 'error';
  message?: ConversationMessage;
  error?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ConversationsGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() payload: JoinConversationDto,
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(`conversation_${payload.conversationId}`);
    client.emit('joined_conversation', { conversationId: payload.conversationId });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() payload: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<SendMessageResponse> {
    try {
      const encryptedMessage = this.encryptionService.encrypt(payload.message);

      const savedMessage = await this.prisma.conversationMessage.create({
        data: {
          conversationId: payload.conversationId,
          senderId: payload.senderId,
          message: encryptedMessage,
          status: MessageStatus.SENT,
        },
      });

      // trimite mesajul la toți participanții conversației
      this.server
        .to(`conversation_${payload.conversationId}`)
        .emit('receive_message', {
          ...savedMessage,
          message: payload.message,
        });

      return { status: 'ok', message: savedMessage };
    } catch (err) {
      console.error(err);
      return { status: 'error', error: 'Failed to send message' };
    }
  }
}
