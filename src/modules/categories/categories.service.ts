import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    // Validare categorie unică (după titlu)
    const existingCategory = await this.prisma.category.findUnique({
      where: { title: createCategoryDto.title },
    });
    if (existingCategory) {
      throw new ConflictException(`O categorie cu titlul "${createCategoryDto.title}" există deja`);
    }

    return await this.prisma.category.create({
      data: {
        title: createCategoryDto.title,
      },
    });
  }

  async findAll() {
    return await this.prisma.category.findMany();
  }

  async findOne(id: number) {
    if (id <= 0) {
      throw new BadRequestException('ID-ul trebuie să fie un număr pozitiv');
    }

    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Categoria cu ID ${id} nu a fost găsită`);
    }
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    if (!category) {
      throw new NotFoundException(`Categoria cu ID ${id} nu a fost găsită`);
    }

    // Validare categorie unică (dacă se actualizează titlul)
    if (updateCategoryDto.title && updateCategoryDto.title !== category.title) {
      const existingCategory = await this.prisma.category.findUnique({
        where: { title: updateCategoryDto.title },
      });
      if (existingCategory) {
        throw new ConflictException(`O categorie cu titlul "${updateCategoryDto.title}" există deja`);
      }
    }

    return await this.prisma.category.update({
      where: { id },
      data: {
        ...(updateCategoryDto.title && { title: updateCategoryDto.title }),
      },
    });
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    if (!category) {
      throw new NotFoundException(`Categoria cu ID ${id} nu a fost găsită`);
    }

    return await this.prisma.category.delete({
      where: { id },
    });
  }
}

