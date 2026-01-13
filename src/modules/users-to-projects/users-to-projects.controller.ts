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
import { UsersToProjectsService } from './users-to-projects.service';
import { CreateUserToProjectDto } from './dto/create-user-to-project.dto';
import { UpdateUserToProjectDto } from './dto/update-user-to-project.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/generated/prisma/enums';

@ApiTags('users-to-projects')
@Controller('users-to-projects')
export class UsersToProjectsController {
  constructor(private readonly usersToProjectsService: UsersToProjectsService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new user to a project' })
  @ApiResponse({ status: 201, description: 'User has been successfully added' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  create(@Body() createUserToProjectDto: CreateUserToProjectDto) {
    return this.usersToProjectsService.create(createUserToProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user-project relationships' })
  @ApiResponse({ status: 200, description: 'List of relationships' })
  findAll() {
    return this.usersToProjectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user-project relationship by ID' })
  @ApiResponse({ status: 200, description: 'Relationship found' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  findOne(@Param('id') id: string) {
    return this.usersToProjectsService.findOne(+id);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all users in a project' })
  @ApiResponse({ status: 200, description: 'List of project users' })
  findByProject(@Param('projectId') projectId: string) {
    return this.usersToProjectsService.findByProject(+projectId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all projects of a user' })
  @ApiResponse({ status: 200, description: 'List of user projects' })
  findByUser(@Param('userId') userId: string) {
    return this.usersToProjectsService.findByUser(+userId);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user-project relationship' })
  @ApiResponse({ status: 200, description: 'Relationship has been successfully updated' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  update(@Param('id') id: string, @Body() updateUserToProjectDto: UpdateUserToProjectDto) {
    return this.usersToProjectsService.update(+id, updateUserToProjectDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a user from a project' })
  @ApiResponse({ status: 200, description: 'User has been successfully removed' })
  @ApiResponse({ status: 404, description: 'Relationship not found' })
  remove(@Param('id') id: string) {
    return this.usersToProjectsService.remove(+id);
  }
}
