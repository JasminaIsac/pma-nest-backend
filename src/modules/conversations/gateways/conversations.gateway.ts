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
import { AttachmentsService } from '../attachments.service';
import { MessageStatus } from 'src/generated/prisma/client';
import { JoinConversationDto } from '../dto/join-conversation.dto';
import { SendMessageDto } from '../dto/send-message.dto';

export interface MentionData {
  id: string;
  name: string;
  type: 'project';
}

export interface AttachmentDto {
  id: string;
  url: string;
  type: string;
  filename: string;
  mimeType: string;
  size: number;
}

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
  attachments: AttachmentDto[];
  mentions: MentionData[];
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
    private readonly attachmentsService: AttachmentsService,
  ) {}

  @SubscribeMessage('join_user_room')
  async handleJoinUserRoom(
    @MessageBody() payload: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
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
      const messageText = payload.message || '';

      // Criptăm mesajul pentru baza de date
      const encryptedMessage = this.encryptionService.encrypt(messageText);

      // Criptăm mentionsData dacă există
      const encryptedMentionsData = payload.mentionsData
        ? this.encryptionService.encrypt(payload.mentionsData)
        : null;

      // Salvăm în DB
      const savedMessage = await this.prisma.conversationMessage.create({
        data: {
          conversationId: payload.conversationId,
          senderId: payload.senderId,
          message: encryptedMessage,
          mentionsData: encryptedMentionsData,
          status: MessageStatus.SENT,
        },
        include: {
          conversation: {
            include: { participants: true },
          },
          sender: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      // Legăm attachment-urile de mesaj dacă există
      if (payload.attachmentIds && payload.attachmentIds.length > 0) {
        await this.attachmentsService.linkToMessage(payload.attachmentIds, savedMessage.id);
      }

      // Fetch attachment-urile legate
      const attachments = await this.attachmentsService.findByMessage(savedMessage.id);

      // Parsăm mentions
      let mentions: MentionData[] = [];
      if (payload.mentionsData) {
        try {
          mentions = JSON.parse(payload.mentionsData) as MentionData[];
        } catch {
          mentions = [];
        }
      }

      // Construim mesajul decriptat pentru emisie
      const decryptedMessage: DecryptedMessage = {
        id: savedMessage.id,
        conversationId: savedMessage.conversationId,
        senderId: savedMessage.senderId,
        message: messageText,
        status: savedMessage.status,
        createdAt: savedMessage.createdAt,
        sender: savedMessage.sender,
        attachments: attachments.map((a) => ({
          id: a.id,
          url: a.url,
          type: a.type,
          filename: a.filename,
          mimeType: a.mimeType,
          size: a.size,
        })),
        mentions,
      };

      // Emitem către camera de conversație
      const roomName = `conversation_${payload.conversationId}`;
      this.server.to(roomName).emit('receive_message', decryptedMessage);

      // Emitem towards camerele individuale ale participanților
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

      await this.prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: payload.conversationId,
            userId: payload.userId,
          },
        },
        data: { lastReadAt },
      });

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
