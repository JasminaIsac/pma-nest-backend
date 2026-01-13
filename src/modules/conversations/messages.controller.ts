import {
  Controller,
  Get, Put,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

interface JwtPayload {
  userId: number;
  email: string;
}

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message (encrypted)' })
  @ApiResponse({ status: 201, description: 'Message succesfully sent' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  create(@Body() createMessageDto: CreateMessageDto, @Request() req: AuthenticatedRequest) {
    return this.messagesService.create(createMessageDto, req.user.userId);
  }

  @Get('conversation/:conversationId/all')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all messages from a conversation' })
  @ApiResponse({ status: 200, description: 'Messages list' })
  findByConversation(@Param('conversationId') conversationId: string, @Request() req: AuthenticatedRequest) {
    return this.messagesService.findByConversation(+conversationId, req.user.userId);
  }

  @Get('conversation/:conversationId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get messages with cursor pagination (infinite scroll, newest first)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Paginated list of messages' })
  async findByConversationCursor(
    @Param('conversationId') conversationId: string,
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.messagesService.findByConversationCursor(
      +conversationId,
      req.user.userId,
      limit ? Number(limit) : 20,
      cursor,
    );
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a message by ID' })
  @ApiResponse({ status: 200, description: 'Message found' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.messagesService.findOne(+id, req.user.userId);
  }

  @Put(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a message' })
  @ApiResponse({ status: 200, description: 'Message updated' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto, @Request() req: AuthenticatedRequest) {
    return this.messagesService.update(+id, updateMessageDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.messagesService.remove(+id, req.user.userId);
  }
}
