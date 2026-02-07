import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { EncryptionService } from './services/encryption.service';
import { ConversationType } from 'src/generated/prisma/client';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async create(createConversationDto: CreateConversationDto, userId: string) {
    const participantIds = Array.from(new Set([...createConversationDto.participantIds, userId]));

    const participantsInDb = await this.prisma.user.findMany({
      where: { id: { in: participantIds } },
    });

    if (participantsInDb.length !== participantIds.length) {
      throw new BadRequestException('One or more participants do not exist');
    }

    if (createConversationDto.type === ConversationType.PRIVATE && participantIds.length !== 2) {
      throw new BadRequestException('A private conversation must have exactly 2 participants');
    }

    if (createConversationDto.type === ConversationType.PRIVATE) {
      const existingPrivateConversation = await this.prisma.conversation.findFirst({
        where: {
          type: ConversationType.PRIVATE,
          AND: participantIds.map(id => ({
            participants: { some: { userId: id } }
          }))
        },
      });

      if (existingPrivateConversation) {
        return existingPrivateConversation;
      }
    }

    return this.prisma.conversation.create({
      data: {
        type: createConversationDto.type,
        name: createConversationDto.name || '',
        participants: {
          create: participantIds.map((id) => ({
            userId: id,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  async findAll(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
        deletedAt: null,
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            message: true,
            createdAt: true,
            sender: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return conversations.map((conv) => ({
      ...conv,
      messages: conv.messages.map((msg) => ({
        ...msg,
        message: this.encryptionService.decrypt(msg.message),
      })),
    }));
  }

  async findAllCursor(userId: string, limit = 10, cursor?: string) {
    const take = limit + 1;

    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
        deletedAt: null,
      },
      take,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            message: true,
            createdAt: true,
            sender: { select: { id: true, name: true } },
          },
        },
      },
    });

    const hasMore = conversations.length > limit;
    const items = hasMore ? conversations.slice(0, limit) : conversations;

    const cleanedItems = await Promise.all(items.map(async (conv) => {
      // Găsim data la care utilizatorul curent a citit ultima dată această conversație
      const currentUserParticipant = conv.participants.find(p => p.userId === userId);
      const lastReadDate = currentUserParticipant?.lastReadAt || new Date(0);

      // Numărăm mesajele necitite
      const unreadCount = await this.prisma.conversationMessage.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          createdAt: { gt: lastReadDate },
        },
      });

      const lastMessage = conv.messages[0] ? {
        ...conv.messages[0],
        message: this.encryptionService.decrypt(conv.messages[0].message)
      } : null;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { messages, ...rest } = conv;

      return {
        ...rest,
        lastMessage,
        unreadCount,
      };
    }));

    return {
      items: cleanedItems,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    };
  }

  async findOne(id: string, userId: string) {
    if (!id) {
      throw new BadRequestException('ID must be a valid UUID v4');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id, deletedAt: null },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, status: true } },
          },
        },
        messages: {
          include: {
            sender: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`The conversation with ID ${id} was not found`);
    }

    const isParticipant = conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw new BadRequestException('You do not have access to this conversation');
    }

    // Actualizăm lastReadAt asincron
    this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: id, userId } },
      data: { lastReadAt: new Date() },
    }).catch(err => console.error('Failed to update lastReadAt', err));

    return {
      ...conversation,
      messages: conversation.messages.map(msg => ({
        ...msg,
        message: this.encryptionService.decrypt(msg.message)
      }))
    };
  }

  async remove(id: string, userId: string) {
    const conversation = await this.findOne(id, userId);
    if (!conversation) {
      throw new NotFoundException(`The conversation with ID ${id} was not found`);
    }

    return await this.prisma.conversation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
