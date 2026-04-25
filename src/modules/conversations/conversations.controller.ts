import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { IsArray, IsString, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';

class UpdateNameDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;
}

class AddParticipantsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  participantIds: string[];
}

@ApiTags('conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'The conversation has been successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  create(@Body() createConversationDto: CreateConversationDto, @CurrentUser() user: JwtPayload) {
    return this.conversationsService.create(createConversationDto, user.userId);
  }

  @Get('all')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all conversations' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.conversationsService.findAll(user.userId);
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get conversations with cursor pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  async findAllCursor(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.conversationsService.findAllCursor(
      user.userId,
      limit ? Number(limit) : 10,
      cursor,
    );
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific conversation' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.conversationsService.findOne(id, user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a specific conversation' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.conversationsService.remove(id, user.userId);
  }

  // ─── Group management endpoints ─────────────────────────────────────────────

  @Patch(':id/name')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update group conversation name (admin only)' })
  updateName(
    @Param('id') id: string,
    @Body() dto: UpdateNameDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.conversationsService.updateName(id, dto.name, user.userId);
  }

  @Patch(':id/cover')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload group cover image (admin only)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('cover', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  async updateCover(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('Only image files are allowed');
    return this.conversationsService.updateCover(id, file.buffer, user.userId);
  }

  @Delete(':id/cover')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove group cover image (admin only)' })
  deleteCover(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.conversationsService.deleteCover(id, user.userId);
  }

  @Post(':id/participants')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add participants to group (admin only)' })
  addParticipants(
    @Param('id') id: string,
    @Body() dto: AddParticipantsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.conversationsService.addParticipants(id, dto.participantIds, user.userId);
  }

  @Delete(':id/participants/:userId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a participant from group (admin only)' })
  removeParticipant(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.conversationsService.removeParticipant(id, targetUserId, user.userId);
  }

  @Post(':id/leave')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a conversation' })
  leave(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.conversationsService.leaveConversation(id, user.userId);
  }
}
