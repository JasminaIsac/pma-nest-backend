import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AttachmentType } from 'src/generated/prisma/client';

export interface CreateAttachmentData {
  cloudinaryId: string;
  url: string;
  type: AttachmentType;
  filename: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPending(data: CreateAttachmentData) {
    return this.prisma.messageAttachment.create({
      data: {
        cloudinaryId: data.cloudinaryId,
        url: data.url,
        type: data.type,
        filename: data.filename,
        mimeType: data.mimeType,
        size: data.size,
        messageId: null,
      },
    });
  }

  async linkToMessage(attachmentIds: string[], messageId: string) {
    await this.prisma.messageAttachment.updateMany({
      where: { id: { in: attachmentIds } },
      data: { messageId },
    });
  }

  async findByMessage(messageId: string) {
    return this.prisma.messageAttachment.findMany({
      where: { messageId },
    });
  }

  async deleteAttachment(id: string) {
    return this.prisma.messageAttachment.delete({
      where: { id },
    });
  }

  getMimeResourceType(mimeType: string): 'image' | 'video' | 'raw' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'raw';
  }

  getMimeAttachmentType(mimeType: string): AttachmentType {
    if (mimeType.startsWith('image/')) return AttachmentType.IMAGE;
    if (mimeType.startsWith('video/')) return AttachmentType.VIDEO;
    return AttachmentType.DOCUMENT;
  }
}
