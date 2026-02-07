import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectStatus, UserRole, TaskStatus } from 'src/generated/prisma/enums';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, currentUserId: string) {
    const categoryExists = await this.prisma.category.findUnique({
      where: { id: createProjectDto.categoryId },
    });

    if (!categoryExists) {
      throw new BadRequestException(
        `Category with ID ${createProjectDto.categoryId} does not exist`,
      );
    }

    if (createProjectDto.deadline) {
      const deadlineDate = new Date(createProjectDto.deadline);
      if (deadlineDate < new Date()) {
        throw new BadRequestException('Deadline date cannot be in the past');
      }
    }

     const newProject = await this.prisma.project.create({
      data: {
        name: createProjectDto.name,
        description: createProjectDto.description,
        categoryId: createProjectDto.categoryId,
        managerId: currentUserId,
        deadline: createProjectDto.deadline
          ? new Date(createProjectDto.deadline)
          : null,
        status: ProjectStatus.NEW,
        // MANAGERUL devine automat membru
        users: {
          create: {
            userId: currentUserId,
            userRole: UserRole.PROJECT_MANAGER,
          },
        },
      },
      include: {
        category: { select: { name: true } },
        manager: { select: { id: true, name: true } },
        users: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });
    return newProject;
  }

  async findAll() {
    return await this.prisma.project.findMany({
      where: { deletedAt: null },
      include: {
        category: { select: { name: true } },
        manager: { select: { name: true } },
      },
    });
  }

  async findAllCursor(limit = 10, cursor?: string) {
    const take = limit + 1;

    const projects = await this.prisma.project.findMany({
      where: { deletedAt: null },
      take,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { updatedAt: 'desc' },
      include: {
        category: { select: { name: true } },
        manager: { select: { name: true } },
      },
    });

    const hasMore = projects.length > limit;
    const items = hasMore ? projects.slice(0, limit) : projects;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    };
  }

  async findOne(id: string) {
    if (!id) {
      throw new BadRequestException('ID must be a valid UUID v4');
    }

    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: { select: { name: true } },
        manager: { select: { name: true } },
      },
    });
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);
    return project;
  }

  async getProjectsCountByCategory() {
    const counts = await this.prisma.project.groupBy({
      by: ['categoryId'],
      where: {
        deletedAt: null,
        status: { not: ProjectStatus.COMPLETED },
      },
      _count: {
        id: true,
      },
    });

    return counts.map(c => ({
      categoryId: c.categoryId,
      projectsCount: c._count.id,
    }));
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, currentUserId: string) {
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

    if (currentUserId) {
      const managerExists = await this.prisma.user.findUnique({
        where: { id: currentUserId },
      });

      if (!managerExists) {
        throw new BadRequestException(`Manager with ID ${currentUserId} does not exist`);
      }
    }

    if (updateProjectDto.deadline) {
      const deadlineDate = new Date(updateProjectDto.deadline);
      if (deadlineDate < new Date()) {
        throw new BadRequestException('Deadline date cannot be in the past');
      }
    }

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: {
        name: updateProjectDto.name,
        description: updateProjectDto.description,
        categoryId: updateProjectDto.categoryId,
        managerId: currentUserId,
        deadline: updateProjectDto.deadline ? new Date(updateProjectDto.deadline) : undefined,
      },
      include: {
        category: { select: { name: true } },
        manager: { select: { name: true } },
      },
    });

    const totalTasksCount = await this.prisma.task.count({
      where: { projectId: id },
    });

    const incompleteTasksCount = await this.prisma.task.count({
      where: {
        projectId: id,
        status: { not: TaskStatus.COMPLETED },
      },
    });

    let newStatus = updatedProject.status;

    if (totalTasksCount > 0 && incompleteTasksCount === 0) {
      newStatus = ProjectStatus.COMPLETED;
    } else if (totalTasksCount === 0) {
      newStatus = ProjectStatus.NEW;
    }

    if (newStatus !== updatedProject.status) {
      const projectWithStatus = await this.prisma.project.update({
        where: { id },
        data: { status: newStatus },
        include: {
          category: { select: { name: true } },
          manager: { select: { name: true } },
        },
      });
      return projectWithStatus;
    }

    return updatedProject;
  }

  async remove(id: string) {
    const project = await this.findOne(id);
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);

    return await this.prisma.project.delete({
      where: { id },
    });
  }
}
