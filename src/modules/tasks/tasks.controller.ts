import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'types/enums';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creează un nou task' })
  @ApiResponse({ status: 201, description: 'Task-ul a fost creat cu succes' })
  @ApiResponse({ status: 400, description: 'Validare eșuată' })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obține toate task-urile' })
  @ApiResponse({ status: 200, description: 'Lista task-urilor' })
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obține un task după ID' })
  @ApiResponse({ status: 200, description: 'Task-ul găsit' })
  @ApiResponse({ status: 404, description: 'Task-ul nu a fost găsit' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizează un task' })
  @ApiResponse({ status: 200, description: 'Task-ul a fost actualizat cu succes' })
  @ApiResponse({ status: 404, description: 'Task-ul nu a fost găsit' })
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(+id, updateTaskDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Șterge un task' })
  @ApiResponse({ status: 200, description: 'Task-ul a fost șters cu succes' })
  @ApiResponse({ status: 404, description: 'Task-ul nu a fost găsit' })
  remove(@Param('id') id: string) {
    return this.tasksService.remove(+id);
  }
}
