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
import { UserRole } from 'types/enums';

@ApiTags('users-to-projects')
@Controller('users-to-projects')
export class UsersToProjectsController {
  constructor(private readonly usersToProjectsService: UsersToProjectsService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adaugă un utilizator la un proiect' })
  @ApiResponse({ status: 201, description: 'Utilizatorul a fost adăugat cu succes' })
  @ApiResponse({ status: 400, description: 'Validare eșuată' })
  create(@Body() createUserToProjectDto: CreateUserToProjectDto) {
    return this.usersToProjectsService.create(createUserToProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obține toate relațiile utilizator-proiect' })
  @ApiResponse({ status: 200, description: 'Lista relațiilor' })
  findAll() {
    return this.usersToProjectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obține o relație după ID' })
  @ApiResponse({ status: 200, description: 'Relația găsită' })
  @ApiResponse({ status: 404, description: 'Relația nu a fost găsită' })
  findOne(@Param('id') id: string) {
    return this.usersToProjectsService.findOne(+id);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Obține toți utilizatorii unui proiect' })
  @ApiResponse({ status: 200, description: 'Lista utilizatorilor proiectului' })
  findByProject(@Param('projectId') projectId: string) {
    return this.usersToProjectsService.findByProject(+projectId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obține toate proiectele unui utilizator' })
  @ApiResponse({ status: 200, description: 'Lista proiectelor utilizatorului' })
  findByUser(@Param('userId') userId: string) {
    return this.usersToProjectsService.findByUser(+userId);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizează o relație utilizator-proiect' })
  @ApiResponse({ status: 200, description: 'Relația a fost actualizată cu succes' })
  @ApiResponse({ status: 404, description: 'Relația nu a fost găsită' })
  update(@Param('id') id: string, @Body() updateUserToProjectDto: UpdateUserToProjectDto) {
    return this.usersToProjectsService.update(+id, updateUserToProjectDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Elimină un utilizator din proiect' })
  @ApiResponse({ status: 200, description: 'Utilizatorul a fost eliminat cu succes' })
  @ApiResponse({ status: 404, description: 'Relația nu a fost găsită' })
  remove(@Param('id') id: string) {
    return this.usersToProjectsService.remove(+id);
  }
}
