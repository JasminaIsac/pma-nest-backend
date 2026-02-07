import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { EncryptionService } from './services/encryption.service';
import { ConversationMessage } from 'src/generated/prisma/client';

export interface Participant {
  id: string;
  conversationId: string;
  userId: string;
  joinedAt: Date;
  lastReadAt: Date | null;
}

export interface PaginatedMessages {
  items: ConversationMessage[];
  nextCursor: string | null;
  hasMore: boolean;
  participants: Participant[];
}

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async create(createMessageDto: CreateMessageDto, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: createMessageDto.conversationId, deletedAt: null },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      throw new BadRequestException(`Conversation with ID ${createMessageDto.conversationId} does not exist`);
    }

    const participants = conversation?.participants as Participant[];
    const isParticipant = participants.some(p => p.userId === userId);

    if (!isParticipant) {
      throw new BadRequestException('You do not have access to this conversation');
    }

    const encryptedMessage = this.encryptionService.encrypt(createMessageDto.message);

    // Folosim $transaction pentru a rula ambele operații deodată
    const [message] = await this.prisma.$transaction([
      this.prisma.conversationMessage.create({
        data: {
          conversationId: createMessageDto.conversationId,
          senderId: userId,
          message: encryptedMessage,
        },
        include: {
          sender: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      // Actualizăm lastReadAt pentru expeditor deodată
      this.prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: createMessageDto.conversationId,
            userId: userId,
          },
        },
        data: { lastReadAt: new Date() },
      }),

      this.prisma.conversation.update({
        where: { id: createMessageDto.conversationId },
        data: { updatedAt: new Date() }
      })
    ]);

    return {
      ...message,
      message: this.encryptionService.decrypt(message.message),
    };
  }

  async findByConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, deletedAt: null },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      throw new BadRequestException(`Conversation with ID ${conversationId} does not exist`);
    }

    const participants = conversation?.participants as Participant[];
    const isParticipant = participants.some((p) => p.userId === userId);

    if (!isParticipant) {
      throw new BadRequestException('You do not have access to this conversation');
    }

    const messages = await this.prisma.conversationMessage.findMany({
      where: { conversationId, deletedAt: null },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            status: true
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return messages.map((msg) => ({
      ...msg,
      message: this.encryptionService.decrypt(msg.message),
    }));
  }

  async findByConversationCursor(
    conversationId: string,
    userId: string,
    limit = 20,
    cursor?: string,
  ) : Promise<PaginatedMessages> {
    if (!conversationId || conversationId === 'undefined') {
      throw new BadRequestException('A valid Conversation UUID is required');
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, deletedAt: null },
      include: { 
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        } 
      },
    });

    if (!conversation) {
      throw new BadRequestException(`Conversation with ID ${conversationId} does not exist`);
    }

    const participants = conversation?.participants as Participant[];
    const isParticipant = participants.some((p) => p.userId === userId);

    if (!isParticipant) {
      throw new BadRequestException('You do not have access to this conversation');
    }

    const take = limit + 1;

    const messages = await this.prisma.conversationMessage.findMany({
      where: { conversationId, deletedAt: null },
      take,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { 
          select: { 
            id: true, 
            name: true, 
            avatarUrl: true 
          } 
        },
      },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;

    return {
      items: items.map(msg => ({
        ...msg,
        message: this.encryptionService.decrypt(msg.message),
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
      participants: participants
    };
  }

  async findOne(id: string, userId: string) {
    if (!id) {
      throw new BadRequestException('The message ID must be a valid UUID');
    }

    const message = await this.prisma.conversationMessage.findFirst({
      where: { id, deletedAt: null },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException(`The message with ID ${id} was not found`);
    }

    const participants = message?.conversation?.participants as Participant[];
    const isParticipant = participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new BadRequestException('Nu ai acces la acest mesaj');
    }

    return {
      ...message,
      message: this.encryptionService.decrypt(message.message),
    };
  }

  async update(id: string, updateMessageDto: UpdateMessageDto, userId: string) {
    const message = await this.findOne(id, userId);
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    if (!updateMessageDto.message || updateMessageDto.message.trim() === '') {
      throw new BadRequestException('Message content cannot be empty');
    }

    if (updateMessageDto.message.length > 5000) {
      throw new BadRequestException('Message content cannot be longer than 5000 characters');
    }

    if (message.deletedAt) {
      throw new BadRequestException('This message has been deleted');
    }

    if (message.createdAt.getTime() + 15 * 60 * 1000 < Date.now()) {
      throw new BadRequestException('You can only edit messages within 15 minutes of sending');
    }

    if (message.senderId !== userId) {
      throw new BadRequestException('You can only edit your own messages');
    }

    return await this.prisma.conversationMessage.update({
      where: { id },
      data: { message: this.encryptionService.encrypt(updateMessageDto.message) },
    })
  }

  async markAsRead(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new BadRequestException('User is not a participant in this conversation');
    }

    return await this.prisma.conversationParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        lastReadAt: new Date(),
      },
    });
  }

  async remove(id: string, userId: string) {
    const message = await this.findOne(id, userId);
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    if (message.senderId !== userId) {
      throw new BadRequestException('You can only delete your own messages');
    }

    return await this.prisma.conversationMessage.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
