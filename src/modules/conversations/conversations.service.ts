import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { EncryptionService } from './services/encryption.service';
import { CloudinaryService } from 'src/common/services/cloudinary.service';
import { ConversationType } from 'src/generated/prisma/client';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private cloudinaryService: CloudinaryService,
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

    // Creatorul devine admin pentru grupuri
    const adminId = createConversationDto.type === ConversationType.GROUP ? userId : null;

    return this.prisma.conversation.create({
      data: {
        type: createConversationDto.type,
        name: createConversationDto.name || '',
        adminId,
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

  // ─── Metodele de management grup ───────────────────────────────────────────

  private async getGroupAsAdmin(id: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id, deletedAt: null },
      include: { participants: { orderBy: { joinedAt: 'asc' } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.type !== ConversationType.GROUP) throw new BadRequestException('This operation is only for group conversations');

    const adminId = (conv as any).adminId as string | null;
    const adminStillInGroup = adminId ? conv.participants.some(p => p.userId === adminId) : false;
    const effectiveAdminId = adminStillInGroup && adminId
      ? adminId
      : conv.participants[0]?.userId ?? null;

    if (effectiveAdminId !== userId) throw new ForbiddenException('Only the group admin can perform this action');
    return conv;
  }

  private async getGroupAsParticipant(id: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id, deletedAt: null },
      include: { participants: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.type !== ConversationType.GROUP) throw new BadRequestException('This operation is only for group conversations');
    const isParticipant = conv.participants.some((p) => p.userId === userId);
    if (!isParticipant) throw new ForbiddenException('You are not a participant in this conversation');
    return conv;
  }

  async updateName(id: string, name: string, userId: string) {
    await this.getGroupAsParticipant(id, userId);
    return this.prisma.conversation.update({
      where: { id },
      data: { name },
      include: { participants: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
    });
  }

  async updateCover(id: string, fileBuffer: Buffer, userId: string) {
    const conv = await this.getGroupAsParticipant(id, userId);

    // Ștergem imaginea veche din Cloudinary
    const existingCoverUrl = (conv as any).coverUrl as string | null;
    if (existingCoverUrl) {
      const publicId = this.cloudinaryService.extractPublicId(existingCoverUrl);
      if (publicId) await this.cloudinaryService.deleteFile(publicId).catch(() => {});
    }

    const uploaded = await this.cloudinaryService.uploadRawFile(
      fileBuffer,
      'project-management-app/group-covers',
      'image',
    );

    return this.prisma.conversation.update({
      where: { id },
      data: { coverUrl: uploaded.url },
      include: { participants: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
    });
  }

  async deleteCover(id: string, userId: string) {
    const conv = await this.getGroupAsParticipant(id, userId);
    const existingCoverUrl = (conv as any).coverUrl as string | null;

    if (existingCoverUrl) {
      const publicId = this.cloudinaryService.extractPublicId(existingCoverUrl);
      if (publicId) await this.cloudinaryService.deleteFile(publicId).catch(() => {});
    }

    return this.prisma.conversation.update({
      where: { id },
      data: { coverUrl: null },
      include: { participants: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
    });
  }

  async addParticipants(id: string, participantIds: string[], userId: string) {
    await this.getGroupAsAdmin(id, userId);

    const users = await this.prisma.user.findMany({ where: { id: { in: participantIds } } });
    if (users.length !== participantIds.length) throw new BadRequestException('One or more users not found');

    // Găsim utilizatorii care nu sunt deja participanți
    const existing = await this.prisma.conversationParticipant.findMany({
      where: { conversationId: id, userId: { in: participantIds } },
    });
    const existingIds = new Set(existing.map(p => p.userId));
    const toAdd = participantIds.filter(uid => !existingIds.has(uid));

    if (toAdd.length > 0) {
      await this.prisma.conversationParticipant.createMany({
        data: toAdd.map(uid => ({ conversationId: id, userId: uid })),
      });
    }

    return this.prisma.conversation.findUnique({
      where: { id },
      include: { participants: { include: { user: { select: { id: true, name: true, avatarUrl: true, status: true } } } } },
    });
  }

  async removeParticipant(id: string, targetUserId: string, userId: string) {
    await this.getGroupAsAdmin(id, userId);

    if (targetUserId === userId) throw new BadRequestException('Use leave endpoint to leave the group');

    await this.prisma.conversationParticipant.deleteMany({
      where: { conversationId: id, userId: targetUserId },
    });

    return this.prisma.conversation.findUnique({
      where: { id },
      include: { participants: { include: { user: { select: { id: true, name: true, avatarUrl: true, status: true } } } } },
    });
  }

  async leaveConversation(id: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id, deletedAt: null },
      include: { participants: { orderBy: { joinedAt: 'asc' } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const isParticipant = conv.participants.some(p => p.userId === userId);
    if (!isParticipant) throw new BadRequestException('You are not a participant');

    const isAdmin = (conv as any).adminId === userId;
    const remaining = conv.participants.filter(p => p.userId !== userId);

    // Ștergem participantul
    await this.prisma.conversationParticipant.deleteMany({
      where: { conversationId: id, userId },
    });

    if (remaining.length === 0) {
      // Ultimul participant — ștergem conversația
      return this.prisma.conversation.update({ where: { id }, data: { deletedAt: new Date() } });
    }

    if (isAdmin && conv.type === ConversationType.GROUP) {
      // Transferăm admin la participantul cu joinedAt cel mai vechi (primul în listă)
      const newAdmin = remaining[0];
      return this.prisma.conversation.update({
        where: { id },
        data: { adminId: newAdmin.userId },
        include: { participants: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
      });
    }

    return this.prisma.conversation.findUnique({
      where: { id },
      include: { participants: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
    });
  }
}
