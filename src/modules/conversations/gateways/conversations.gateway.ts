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
import { MessageStatus } from 'src/generated/prisma/client';
import { JoinConversationDto } from '../dto/join-conversation.dto';
import { SendMessageDto } from '../dto/send-message.dto';

export interface DecryptedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  status: MessageStatus;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface SendMessageResponse {
  status: 'ok' | 'error';
  message?: DecryptedMessage;
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

  @SubscribeMessage('join_user_room')
  async handleJoinUserRoom(
    @MessageBody() payload: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Clientul se alătură unei camere private: user_uuid
    // Aceasta permite primirea update-urilor de Inbox chiar dacă nu este într-o conversație specifică
    await client.join(`user_${payload.userId}`);
  }

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @ConnectedSocket() _client: Socket,
  ): Promise<SendMessageResponse> {
    try {
      // Criptăm mesajul pentru baza de date
      const encryptedMessage = this.encryptionService.encrypt(payload.message);

      // Salvăm în DB și includem relațiile necesare pentru UI
      const savedMessage = await this.prisma.conversationMessage.create({
        data: {
          conversationId: payload.conversationId,
          senderId: payload.senderId,
          message: encryptedMessage,
          status: MessageStatus.SENT,
        },
        include: {
          conversation: {
            include: { participants: true }
          },
          sender: { 
            select: { id: true, name: true, avatarUrl: true } 
          }
        }
      });

      // Creăm obiectul decriptat pentru emisie (folosim textul original din payload)
      const decryptedMessage: DecryptedMessage = {
        ...savedMessage,
        message: payload.message, // Suprascriem hash-ul cu textul clar
      };

      // Emitem către camera de conversație (pentru cei care au chat-ul deschis)
      const roomName = `conversation_${payload.conversationId}`;
      this.server.to(roomName).emit('receive_message', decryptedMessage);

      // Emitem către camerele individuale ale participanților
      savedMessage.conversation.participants.forEach((participant) => {
        this.server.to(`user_${participant.userId}`).emit('conversation_updated', {
          conversationId: payload.conversationId,
          lastMessage: decryptedMessage,
        });
      });

      return { status: 'ok', message: decryptedMessage };
      
    } catch (err) {
      console.error('Socket SendMessage Error:', err);
      return { status: 'error', error: 'Failed to send message' };
    }
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody() payload: { conversationId: string; userId: string },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const lastReadAt = new Date();

      // Actualizăm în baza de date momentul în care participantul a citit
      await this.prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: payload.conversationId,
            userId: payload.userId,
          },
        },
        data: { lastReadAt },
      });

      // Notificăm TOȚI ceilalți din cameră că acest user a citit mesajele
      const roomName = `conversation_${payload.conversationId}`;
      this.server.to(roomName).emit('user_read_update', {
        userId: payload.userId,
        lastReadAt: lastReadAt,
      });

      return { status: 'ok' };
    } catch (err) {
      console.error('Error marking as read:', err);
      return { status: 'error' };
    }
  }
}