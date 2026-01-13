import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { LogEntity, UserRole } from 'src/generated/prisma/client';

@ApiTags('logs')
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  // GET /logs?page=1&limit=10
  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get logs with pagination' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({ status: 200, description: 'Paginated list of logs' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.logsService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  // GET /logs/entity/project
  @Get('entity/:entityName')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get logs by entity' })
  @ApiResponse({ status: 200, description: 'Logs for entity' })
  findByEntity(
    @Param('entityName') entityName: LogEntity,
  ) {
    return this.logsService.findByEntity(entityName);
  }

  // GET /logs/entity/project/5
  @Get('entity/:entityName/:entityId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get logs by entity and entityId' })
  @ApiResponse({ status: 200, description: 'Logs for entity item' })
  findByEntityAndId(
    @Param('entityName') entityName: LogEntity,
    @Param('entityId', ParseIntPipe) entityId: number,
  ) {
    return this.logsService.findByEntity(entityName, entityId);
  }
}
