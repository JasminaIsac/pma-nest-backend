import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'types/enums';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creează un nou utilizator' })
  @ApiResponse({ status: 201, description: 'Utilizatorul a fost creat cu succes' })
  @ApiResponse({ status: 400, description: 'Validare eșuată' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obține toți utilizatorii' })
  @ApiResponse({ status: 200, description: 'Lista utilizatorilor' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obține un utilizator după ID' })
  @ApiResponse({ status: 200, description: 'Utilizatorul găsit' })
  @ApiResponse({ status: 404, description: 'Utilizatorul nu a fost găsit' })
  findOne(@Param('id') id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizează un utilizator' })
  @ApiResponse({ status: 200, description: 'Utilizatorul a fost actualizat cu succes' })
  @ApiResponse({ status: 404, description: 'Utilizatorul nu a fost găsit' })
  update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)  
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sterge un utilizator' })
  @ApiResponse({ status: 200, description: 'Utilizatorul a fost sters cu succes' })
  @ApiResponse({ status: 404, description: 'Utilizatorul nu a fost găsit' })
  remove(@Param('id') id: number) {
    return this.userService.remove(id);
  }
}
