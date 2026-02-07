import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';

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
  @ApiResponse({ status: 200, description: 'The list of conversations' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.conversationsService.findAll(user.userId);
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get conversations with cursor pagination (infinite scroll)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Paginated list of conversations' })
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
  @ApiResponse({ status: 200, description: 'The conversation has been successfully retrieved' })
  @ApiResponse({ status: 404, description: 'The conversation was not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.conversationsService.findOne(id, user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a specific conversation' })
  @ApiResponse({ status: 200, description: 'The conversation has been successfully deleted' })
  @ApiResponse({ status: 404, description: 'The conversation was not found' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.conversationsService.remove(id, user.userId);
  }
}
