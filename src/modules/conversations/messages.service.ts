import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { EncryptionService } from './services/encryption.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async create(createMessageDto: CreateMessageDto, userId: number) {
    // Validare conversație există
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: createMessageDto.conversation_id },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      throw new BadRequestException(`Conversația cu ID ${createMessageDto.conversation_id} nu există`);
    }

    // Validare: utilizatorul trebuie să fie participant
    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new BadRequestException('Nu ai acces la această conversație');
    }

    // Criptează mesajul
    const encryptedMessage = this.encryptionService.encrypt(createMessageDto.message);

    // Creează mesajul
    const message = await this.prisma.conversationMessage.create({
      data: {
        conversationId: createMessageDto.conversation_id,
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

    // Decrypt mesajul pentru răspuns
    return {
      ...message,
      message: this.encryptionService.decrypt(message.message),
    };
  }

  async findByConversation(conversationId: number, userId: number) {
    // Validare utilizator este participant
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      throw new BadRequestException(`Conversația cu ID ${conversationId} nu există`);
    }

    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new BadRequestException('Nu ai acces la această conversație');
    }

    // Obțin mesajele
    const messages = await this.prisma.conversationMessage.findMany({
      where: { conversationId },
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

    // Decriptează mesajele
    return messages.map((msg) => ({
      ...msg,
      message: this.encryptionService.decrypt(msg.message),
    }));
  }

  async findOne(id: number, userId: number) {
    if (id <= 0) {
      throw new BadRequestException('ID-ul trebuie să fie un număr pozitiv');
    }

    const message = await this.prisma.conversationMessage.findUnique({
      where: { id },
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
      throw new NotFoundException(`Mesajul cu ID ${id} nu a fost găsit`);
    }

    // Validare: utilizatorul trebuie să fie participant
    const isParticipant = message.conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new BadRequestException('Nu ai acces la acest mesaj');
    }

    return {
      ...message,
      message: this.encryptionService.decrypt(message.message),
    };
  }

  async remove(id: number, userId: number) {
    const message = await this.findOne(id, userId);
    if (!message) {
      throw new NotFoundException(`Mesajul cu ID ${id} nu a fost găsit`);
    }

    // Validare: doar autorul poate șterge mesajul
    if (message.senderId !== userId) {
      throw new BadRequestException('Poți șterge doar mesajele tale');
    }

    return await this.prisma.conversationMessage.delete({
      where: { id },
    });
  }
}
