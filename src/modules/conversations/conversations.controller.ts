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
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

interface JwtPayload {
  userId: number;
  email: string;
}

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@ApiTags('conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creează o nouă conversație' })
  @ApiResponse({ status: 201, description: 'Conversația a fost creată cu succes' })
  @ApiResponse({ status: 400, description: 'Validare eșuată' })
  create(@Body() createConversationDto: CreateConversationDto, @Request() req: AuthenticatedRequest) {
    return this.conversationsService.create(createConversationDto, req.user.userId);
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obține toate conversațiile utilizatorului' })
  @ApiResponse({ status: 200, description: 'Lista conversațiilor' })
  findAll(@Request() req: AuthenticatedRequest) {
    return this.conversationsService.findAll(req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obține o conversație după ID' })
  @ApiResponse({ status: 200, description: 'Conversația găsită' })
  @ApiResponse({ status: 404, description: 'Conversația nu a fost găsită' })
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.conversationsService.findOne(+id, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Șterge o conversație' })
  @ApiResponse({ status: 200, description: 'Conversația a fost ștearsă cu succes' })
  @ApiResponse({ status: 404, description: 'Conversația nu a fost găsită' })
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.conversationsService.remove(+id, req.user.userId);
  }
}
