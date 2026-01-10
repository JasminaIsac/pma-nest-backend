import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto) {
    // Validare proiect există
    const projectExists = await this.prisma.project.findUnique({
      where: { id: createTaskDto.project_id },
    });
    if (!projectExists) {
      throw new BadRequestException(`Proiectul cu ID ${createTaskDto.project_id} nu există`);
    }

    // Validare utilizator (assignee) există
    const userExists = await this.prisma.user.findUnique({
      where: { id: createTaskDto.assigned_to },
    });
    if (!userExists) {
      throw new BadRequestException(`Utilizatorul cu ID ${createTaskDto.assigned_to} nu există`);
    }

    // Validare deadline în viitor
    const deadlineDate = new Date(createTaskDto.deadline);
    if (deadlineDate < new Date()) {
      throw new BadRequestException('Data deadline-ului nu poate fi în trecut');
    }

    return await this.prisma.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        project_id: createTaskDto.project_id,
        priority: createTaskDto.priority || 'medium',
        assigned_to: createTaskDto.assigned_to,
        deadline: deadlineDate,
        status: createTaskDto.status || 'new',
      },
    });
  }

  async findAll() {
    return await this.prisma.task.findMany({
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

  async findOne(id: number) {
    if (id <= 0) {
      throw new BadRequestException('ID-ul trebuie să fie un număr pozitiv');
    }

    const task = await this.prisma.task.findUnique({
      where: { id },
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
      throw new NotFoundException(`Task-ul cu ID ${id} nu a fost găsit`);
    }
    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    const task = await this.findOne(id);
    if (!task) {
      throw new NotFoundException(`Task-ul cu ID ${id} nu a fost găsit`);
    }

    // Validare proiect (dacă se actualizează)
    if (updateTaskDto.project_id && updateTaskDto.project_id !== task.project_id) {
      const projectExists = await this.prisma.project.findUnique({
        where: { id: updateTaskDto.project_id },
      });
      if (!projectExists) {
        throw new BadRequestException(`Proiectul cu ID ${updateTaskDto.project_id} nu există`);
      }
    }

    // Validare utilizator (dacă se actualizează)
    if (updateTaskDto.assigned_to && updateTaskDto.assigned_to !== task.assigned_to) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: updateTaskDto.assigned_to },
      });
      if (!userExists) {
        throw new BadRequestException(`Utilizatorul cu ID ${updateTaskDto.assigned_to} nu există`);
      }
    }

    // Validare deadline (dacă se actualizează)
    if (updateTaskDto.deadline) {
      const deadlineDate = new Date(updateTaskDto.deadline);
      if (deadlineDate < new Date()) {
        throw new BadRequestException('Data deadline-ului nu poate fi în trecut');
      }
    }

    return await this.prisma.task.update({
      where: { id },
      data: {
        ...(updateTaskDto.title && { title: updateTaskDto.title }),
        ...(updateTaskDto.description !== undefined && { description: updateTaskDto.description }),
        ...(updateTaskDto.project_id && { project_id: updateTaskDto.project_id }),
        ...(updateTaskDto.priority && { priority: updateTaskDto.priority }),
        ...(updateTaskDto.assigned_to && { assigned_to: updateTaskDto.assigned_to }),
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

  async remove(id: number) {
    const task = await this.findOne(id);
    if (!task) {
      throw new NotFoundException(`Task-ul cu ID ${id} nu a fost găsit`);
    }

    return await this.prisma.task.delete({
      where: { id },
    });
  }
}
