import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole, LogEntity, LogAction } from 'src/generated/prisma/client';
import { LogActivity } from 'src/common/decorators/log-action.decorator';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiBearerAuth()
  @LogActivity(LogEntity.TASK, LogAction.CREATE)
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task was created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all tasks (no pagination)' })
  @ApiResponse({ status: 200, description: 'List of all tasks' })
  findAll() {
    return this.tasksService.findAll();
  }

  @Get('')
  @ApiOperation({ summary: 'Get tasks with cursor pagination (infinite scroll)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Paginated list of tasks' })
  findAllCursor(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.tasksService.findAllCursor(
      limit ? Number(limit) : 10,
      cursor,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiResponse({ status: 200, description: 'Task found' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiBearerAuth()
  @LogActivity(LogEntity.TASK, LogAction.UPDATE)
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'Task was updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(+id, updateTaskDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiBearerAuth()
  @LogActivity(LogEntity.TASK, LogAction.DELETE)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'Task was deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  remove(@Param('id') id: string) {
    return this.tasksService.remove(+id);
  }
}
