import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const existingCategory = await this.prisma.category.findUnique({
      where: { title: createCategoryDto.title },
    });
    if (existingCategory) {
      throw new ConflictException(`A category with the title "${createCategoryDto.title}" already exists.`);
    }

    return await this.prisma.category.create({
      data: {
        title: createCategoryDto.title,
      },
    });
  }

  async findAll() {
    return await this.prisma.category.findMany({
      where: { deletedAt: null },
    });
  }

  async findOne(id: string) {
    if (!id) {
      throw new BadRequestException('ID must be provided');
    }

    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException(`The category with ID ${id} was not found`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    if (!category) {
      throw new NotFoundException(`The category with ID ${id} was not found`);
    }

    if (updateCategoryDto.title && updateCategoryDto.title !== category.title) {
      const existingCategory = await this.prisma.category.findUnique({
        where: { title: updateCategoryDto.title },
      });
      if (existingCategory) {
        throw new ConflictException(`A category with the title "${updateCategoryDto.title}" already exists.`);
      }
    }

      return await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
      });
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    if (!category) {
      throw new NotFoundException(`The category with ID ${id} was not found`);
    }

    return await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

