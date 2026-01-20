import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskPriority, TaskStatus } from 'src/generated/prisma/enums';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto) {
    const projectExists = await this.prisma.project.findUnique({
      where: { id: createTaskDto.projectId },
    });
    if (!projectExists) {
      throw new BadRequestException(`Project with ID ${createTaskDto.projectId} does not exist`);
    }

    const userExists = await this.prisma.user.findUnique({
      where: { id: createTaskDto.assignedTo },
    });
    if (!userExists || userExists.deletedAt !== null) {
      throw new BadRequestException(`User with ID ${createTaskDto.assignedTo} does not exist or has been deleted`);
    }

    const deadlineDate = new Date(createTaskDto.deadline);
    if (deadlineDate < new Date()) {
      throw new BadRequestException('Deadline date cannot be in the past');
    }

    return await this.prisma.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        projectId: createTaskDto.projectId,
        priority: createTaskDto.priority || TaskPriority.MEDIUM,
        assignedTo: createTaskDto.assignedTo,
        deadline: deadlineDate,
        status: createTaskDto.status || TaskStatus.NEW,
      },
    });
  }

  async findAll() {
    return await this.prisma.task.findMany({
      where: { deletedAt: null },
      include: {
        project: true,
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });  
  }

  async findAllCursor(limit = 10, cursor?: string) {
    const take = limit + 1;

    const tasks = await this.prisma.task.findMany({
      where: { deletedAt: null },
      take,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { id: 'desc' },
      include: {
        project: true,
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const hasMore = tasks.length > limit;
    const items = hasMore ? tasks.slice(0, limit) : tasks;

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

    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: true,
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    const task = await this.findOne(id);
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    if (updateTaskDto.projectId && updateTaskDto.projectId !== task.projectId) {
      const projectExists = await this.prisma.project.findUnique({
        where: { id: updateTaskDto.projectId },
      });
      if (!projectExists || projectExists.deletedAt !== null) {
        throw new BadRequestException(`Project with ID ${updateTaskDto.projectId} does not exist or has been deleted`);
      }
    }

    if (updateTaskDto.assignedTo && updateTaskDto.assignedTo !== task.assignedTo) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: updateTaskDto.assignedTo },
      });
      if (!userExists || userExists.deletedAt !== null) {
        throw new BadRequestException(`User with ID ${updateTaskDto.assignedTo} does not exist or has been deleted`);
      }
    }

    if (updateTaskDto.deadline) {
      const deadlineDate = new Date(updateTaskDto.deadline);
      if (deadlineDate < new Date()) {
        throw new BadRequestException('Deadline date cannot be in the past');
      }
    }

    return await this.prisma.task.update({
      where: { id },
      data: {
        ...(updateTaskDto.title && { title: updateTaskDto.title }),
        ...(updateTaskDto.description !== undefined && { description: updateTaskDto.description }),
        ...(updateTaskDto.projectId && { projectId: updateTaskDto.projectId }),
        ...(updateTaskDto.priority && { priority: updateTaskDto.priority }),
        ...(updateTaskDto.assignedTo && { assignedTo: updateTaskDto.assignedTo }),
        ...(updateTaskDto.deadline && { deadline: new Date(updateTaskDto.deadline) }),
        ...(updateTaskDto.status && { status: updateTaskDto.status }),
      },
      include: {
        project: true,
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const task = await this.findOne(id);
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return await this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
