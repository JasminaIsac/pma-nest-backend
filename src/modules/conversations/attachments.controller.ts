import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { CloudinaryService } from 'src/common/services/cloudinary.service';
import { AttachmentsService } from './attachments.service';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-excel',
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

@ApiTags('Attachments')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('messages/attachments')
export class AttachmentsController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file attachment for a chat message' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadAttachment(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not allowed. Allowed types: images, videos, PDF, Word, Excel`,
      );
    }

    const resourceType = this.attachmentsService.getMimeResourceType(file.mimetype);
    const attachmentType = this.attachmentsService.getMimeAttachmentType(file.mimetype);

    const uploaded = await this.cloudinaryService.uploadRawFile(
      file.buffer,
      'project-management-app/chat-attachments',
      resourceType,
    );

    const attachment = await this.attachmentsService.createPending({
      cloudinaryId: uploaded.publicId,
      url: uploaded.url,
      type: attachmentType,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: uploaded.bytes,
    });

    return {
      attachmentId: attachment.id,
      url: attachment.url,
      type: attachment.type,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      size: attachment.size,
    };
  }
}
