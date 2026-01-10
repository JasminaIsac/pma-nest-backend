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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'types/enums';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creează o nouă categorie' })
  @ApiResponse({ status: 201, description: 'Categoria a fost creată cu succes' })
  @ApiResponse({ status: 400, description: 'Validare eșuată' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obține toate categoriile' })
  @ApiResponse({ status: 200, description: 'Lista categoriilor' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obține o categorie după ID' })
  @ApiResponse({ status: 200, description: 'Categoria găsită' })
  @ApiResponse({ status: 404, description: 'Categoria nu a fost găsită' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizează o categorie' })
  @ApiResponse({ status: 200, description: 'Categoria a fost actualizată cu succes' })
  @ApiResponse({ status: 404, description: 'Categoria nu a fost găsită' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Șterge o categorie' })
  @ApiResponse({ status: 200, description: 'Categoria a fost ștearsă cu succes' })
  @ApiResponse({ status: 404, description: 'Categoria nu a fost găsită' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}
