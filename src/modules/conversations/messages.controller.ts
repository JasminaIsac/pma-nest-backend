import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
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
  @ApiOperation({ summary: 'Trimite un mesaj (criptat)' })
  @ApiResponse({ status: 201, description: 'Mesajul a fost trimis cu succes' })
  @ApiResponse({ status: 400, description: 'Validare eșuată' })
  create(@Body() createMessageDto: CreateMessageDto, @Request() req: AuthenticatedRequest) {
    return this.messagesService.create(createMessageDto, req.user.userId);
  }

  @Get('conversation/:conversationId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obține toate mesajele unei conversații (decriptate)' })
  @ApiResponse({ status: 200, description: 'Lista mesajelor' })
  findByConversation(@Param('conversationId') conversationId: string, @Request() req: AuthenticatedRequest) {
    return this.messagesService.findByConversation(+conversationId, req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obține un mesaj după ID (decriptat)' })
  @ApiResponse({ status: 200, description: 'Mesajul găsit' })
  @ApiResponse({ status: 404, description: 'Mesajul nu a fost găsit' })
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.messagesService.findOne(+id, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Șterge un mesaj' })
  @ApiResponse({ status: 200, description: 'Mesajul a fost șters cu succes' })
  @ApiResponse({ status: 404, description: 'Mesajul nu a fost găsit' })
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.messagesService.remove(+id, req.user.userId);
  }
}
