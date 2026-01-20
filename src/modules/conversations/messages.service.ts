import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { EncryptionService } from './services/encryption.service';

interface Participant {
  id: string;
  conversationId: string;
  userId: string;
  joinedAt: Date;
  lastReadAt: Date | null;
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

    const message = await this.prisma.conversationMessage.create({
      data: {
        conversationId: createMessageDto.conversationId,
        senderId: userId,
        message: encryptedMessage,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

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
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
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
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, deletedAt: null },
      include: { participants: true },
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
      orderBy: { id: 'desc' },
      include: {
        sender: { select: { id: true, name: true, email: true } },
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
            email: true,
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
