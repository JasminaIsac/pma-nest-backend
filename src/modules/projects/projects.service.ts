import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    const categoryExists = await this.prisma.category.findUnique({
      where: { id: createProjectDto.categoryId },
    });
    if (!categoryExists) {
      throw new BadRequestException(`Category with ID ${createProjectDto.categoryId} does not exist`);
    }

    const managerExists = await this.prisma.user.findUnique({
      where: { id: createProjectDto.managerId },
    });
    if (!managerExists) {
      throw new BadRequestException(`Manager with ID ${createProjectDto.managerId} does not exist`);
    }

    if (createProjectDto.deadline) {
      const deadlineDate = new Date(createProjectDto.deadline);
      if (deadlineDate < new Date()) {
        throw new BadRequestException('DDeadline date cannot be in the past');
      }
    }

    return await this.prisma.project.create({
      data: {
        name: createProjectDto.name,
        description: createProjectDto.description,
        categoryId: createProjectDto.categoryId,
        managerId: createProjectDto.managerId,
        deadline: createProjectDto.deadline ? new Date(createProjectDto.deadline) : null,
      },
    });
  }

  async findAll() {
    return await this.prisma.project.findMany({
      where: { deletedAt: null },
    });
  }

  async findAllCursor(limit = 10, cursor?: string) {
    const take = limit + 1;

    const projects = await this.prisma.project.findMany({
      where: { deletedAt: null },
      take,
      ...(cursor && {
        cursor: { id: Number(cursor) },
        skip: 1,
      }),
      orderBy: { id: 'desc' },
    });

    const hasMore = projects.length > limit;
    const items = hasMore ? projects.slice(0, limit) : projects;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    };
  }

  async findOne(id: number) {
    if (id <= 0) {
      throw new BadRequestException('ID must be a positive number');
    }

    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
    });
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);
    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto) {
    const project = await this.findOne(id);
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);

    if (updateProjectDto.categoryId) {
      const categoryExists = await this.prisma.category.findUnique({
        where: { id: updateProjectDto.categoryId },
      });
      if (!categoryExists) {
        throw new BadRequestException(`Category with ID ${updateProjectDto.categoryId} does not exist`);
      }
    }

    if (updateProjectDto.managerId) {
      const managerExists = await this.prisma.user.findUnique({
        where: { id: updateProjectDto.managerId },
      });
      if (!managerExists) {
        throw new BadRequestException(`Manager with ID ${updateProjectDto.managerId} does not exist`);
      }
    }

    if (updateProjectDto.deadline) {
      const deadlineDate = new Date(updateProjectDto.deadline);
      if (deadlineDate < new Date()) {
        throw new BadRequestException('Deadline date cannot be in the past');
      }
    }

    return await this.prisma.project.update({
      where: { id },
      data: {
        name: updateProjectDto.name,
        description: updateProjectDto.description,
        categoryId: updateProjectDto.categoryId,
        managerId: updateProjectDto.managerId,
        deadline: updateProjectDto.deadline ? new Date(updateProjectDto.deadline) : undefined,
      },
    });
  }

  async remove(id: number) {
    const project = await this.findOne(id);
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);

    return await this.prisma.project.delete({
      where: { id },
    });
  }
}
