import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async create(createConversationDto: CreateConversationDto, userId: number) {
    // Validare participanți există
    const participants = await this.prisma.user.findMany({
      where: { id: { in: createConversationDto.participant_ids } },
    });

    if (participants.length !== createConversationDto.participant_ids.length) {
      throw new BadRequestException('Unii participanți nu există');
    }

    // Validare: utilizatorul curent trebuie să fie în lista participanților
    if (!createConversationDto.participant_ids.includes(userId)) {
      throw new BadRequestException('Trebuie să te incluzi pe tine însuți în conversație');
    }

    // Pentru conversații private, trebuie exact 2 participanți
    if (createConversationDto.type === 'private' && createConversationDto.participant_ids.length !== 2) {
      throw new BadRequestException('O conversație privată trebuie să aibă exact 2 participanți');
    }

    // Verifica dacă o conversație privată deja există între acești 2 utilizatori
    if (createConversationDto.type === 'private') {
      const existingPrivateConversation = await this.prisma.conversation.findFirst({
        where: {
          type: 'private',
          participants: {
            every: {
              userId: { in: createConversationDto.participant_ids },
            },
          },
        },
      });

      if (existingPrivateConversation) {
        throw new ConflictException('O conversație privată deja există între acești participanți');
      }
    }

    // Creează conversația
    const conversation = await this.prisma.conversation.create({
      data: {
        type: createConversationDto.type,
        participants: {
          create: createConversationDto.participant_ids.map((id) => ({
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

  async findOne(id: number, userId: number) {
    if (id <= 0) {
      throw new BadRequestException('ID-ul trebuie să fie un număr pozitiv');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
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
      throw new NotFoundException(`Conversația cu ID ${id} nu a fost găsită`);
    }

    // Verifica dacă utilizatorul este participant
    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new BadRequestException('Nu ai acces la această conversație');
    }

    // Actualizează lastReadAt
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
      throw new NotFoundException(`Conversația cu ID ${id} nu a fost găsită`);
    }

    return await this.prisma.conversation.delete({
      where: { id },
    });
  }
}
