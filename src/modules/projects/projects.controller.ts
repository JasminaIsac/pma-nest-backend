import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserRole, LogEntity, LogAction } from 'src/generated/prisma/client';
import { LogActivity } from 'src/common/decorators/log-action.decorator';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiBearerAuth()
  @LogActivity(LogEntity.PROJECT, LogAction.CREATE)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  async create(@Body() createProjectDto: CreateProjectDto) {
    return await this.projectsService.create(createProjectDto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  async findAll() {
    return await this.projectsService.findAll();
  }

  @Get()
  @ApiOperation({ summary: 'Get projects with cursor pagination (infinite scroll)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Paginated list of projects' })
  async findAllCursor(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return await this.projectsService.findAllCursor(
      limit ? Number(limit) : 10,
      cursor,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.projectsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @LogActivity(LogEntity.PROJECT, LogAction.UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return await this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @LogActivity(LogEntity.PROJECT, LogAction.DELETE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.projectsService.remove(id);
  }
}
