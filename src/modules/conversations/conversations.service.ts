import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ConversationType, ConversationParticipant as PrismaConversationParticipant } from 'src/generated/prisma/client';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async create(createConversationDto: CreateConversationDto, userId: number) {
    const participants = await this.prisma.user.findMany({
      where: { id: { in: createConversationDto.participantIds } },
    });

    if (participants.length !== createConversationDto.participantIds.length) {
      throw new BadRequestException('Some participants do not exist');
    }

    if (!createConversationDto.participantIds.includes(userId)) {
      throw new BadRequestException('You must include yourself in the conversation');
    }

    if (createConversationDto.type === ConversationType.PRIVATE && createConversationDto.participantIds.length !== 2) {
      throw new BadRequestException('A private conversation must have exactly 2 participants');
    }

    if (createConversationDto.type === ConversationType.PRIVATE) {
      const existingPrivateConversation = await this.prisma.conversation.findFirst({
        where: {
          type: ConversationType.PRIVATE,
          participants: {
            every: {
              userId: { in: createConversationDto.participantIds },
            },
          },
        },
      });

      if (existingPrivateConversation) {
        throw new ConflictException('A private conversation already exists between these participants');
      }
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: createConversationDto.type,
        participants: {
          create: createConversationDto.participantIds.map((id) => ({
            userId: id,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return conversation;
  }

  async findAll(userId: number) {
    return await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
        deletedAt: null,
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllCursor(userId: number, limit = 10, cursor?: string) {
    const take = limit + 1;

    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
        deletedAt: null,
      },
      take,
      ...(cursor && {
        cursor: { id: Number(cursor) },
        skip: 1,
      }),
      orderBy: { id: 'desc' },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const hasMore = conversations.length > limit;
    const items = hasMore ? conversations.slice(0, limit) : conversations;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    };
  }

  async findOne(id: number, userId: number) {
    if (id <= 0) {
      throw new BadRequestException('The conversation ID must be a positive integer');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id, deletedAt: null },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        messages: {
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
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`The conversation with ID ${id} was not found`);
    }

    const participants = conversation?.participants as PrismaConversationParticipant[];
    const isParticipant = participants.some(p => p.userId === userId);

    if (!isParticipant) {
      throw new BadRequestException('You do not have access to this conversation');
    }

    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return conversation;
  }

  async remove(id: number, userId: number) {
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
