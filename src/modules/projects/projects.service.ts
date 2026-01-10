import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    // Validări business logic
    const categoryExists = await this.prisma.category.findUnique({
      where: { id: createProjectDto.category_id },
    });
    if (!categoryExists) {
      throw new BadRequestException(`Categoria cu ID ${createProjectDto.category_id} nu există`);
    }

    const managerExists = await this.prisma.user.findUnique({
      where: { id: createProjectDto.manager_id },
    });
    if (!managerExists) {
      throw new BadRequestException(`Managerul cu ID ${createProjectDto.manager_id} nu există`);
    }

    // Validare deadline
    if (createProjectDto.deadline) {
      const deadlineDate = new Date(createProjectDto.deadline);
      if (deadlineDate < new Date()) {
        throw new BadRequestException('Data deadline-ului nu poate fi în trecut');
      }
    }

    return await this.prisma.project.create({
      data: {
        name: createProjectDto.name,
        description: createProjectDto.description,
        category_id: createProjectDto.category_id,
        manager_id: createProjectDto.manager_id,
        deadline: createProjectDto.deadline ? new Date(createProjectDto.deadline) : null,
      },
    });
  }

  async findAll() {
    return await this.prisma.project.findMany();
  }

  async findOne(id: number) {
    if (id <= 0) {
      throw new BadRequestException('ID-ul trebuie să fie un număr pozitiv');
    }

    const project = await this.prisma.project.findUnique({
      where: { id },
    });
    if (!project) throw new NotFoundException(`Proiectul cu ID ${id} nu a fost găsit`);
    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto) {
    const project = await this.findOne(id);
    if (!project) throw new NotFoundException(`Proiectul cu ID ${id} nu a fost găsit`);

    // Validări pentru câmpurile actualizate
    if (updateProjectDto.category_id) {
      const categoryExists = await this.prisma.category.findUnique({
        where: { id: updateProjectDto.category_id },
      });
      if (!categoryExists) {
        throw new BadRequestException(`Categoria cu ID ${updateProjectDto.category_id} nu există`);
      }
    }

    if (updateProjectDto.manager_id) {
      const managerExists = await this.prisma.user.findUnique({
        where: { id: updateProjectDto.manager_id },
      });
      if (!managerExists) {
        throw new BadRequestException(`Managerul cu ID ${updateProjectDto.manager_id} nu există`);
      }
    }

    if (updateProjectDto.deadline) {
      const deadlineDate = new Date(updateProjectDto.deadline);
      if (deadlineDate < new Date()) {
        throw new BadRequestException('Data deadline-ului nu poate fi în trecut');
      }
    }

    return await this.prisma.project.update({
      where: { id },
      data: {
        name: updateProjectDto.name,
        description: updateProjectDto.description,
        category_id: updateProjectDto.category_id,
        manager_id: updateProjectDto.manager_id,
        deadline: updateProjectDto.deadline ? new Date(updateProjectDto.deadline) : undefined,
      },
    });
  }

  async remove(id: number) {
    const project = await this.findOne(id);
    if (!project) throw new NotFoundException(`Proiectul cu ID ${id} nu a fost găsit`);

    return await this.prisma.project.delete({
      where: { id },
    });
  }
}
