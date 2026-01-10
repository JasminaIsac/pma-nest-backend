import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserToProjectDto } from './dto/create-user-to-project.dto';
import { UpdateUserToProjectDto } from './dto/update-user-to-project.dto';

@Injectable()
export class UsersToProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createUserToProjectDto: CreateUserToProjectDto) {
    // Validare proiect există
    const projectExists = await this.prisma.project.findUnique({
      where: { id: createUserToProjectDto.project_id },
    });
    if (!projectExists) {
      throw new BadRequestException(`Proiectul cu ID ${createUserToProjectDto.project_id} nu există`);
    }

    // Validare utilizator există
    const userExists = await this.prisma.user.findUnique({
      where: { id: createUserToProjectDto.user_id },
    });
    if (!userExists) {
      throw new BadRequestException(`Utilizatorul cu ID ${createUserToProjectDto.user_id} nu există`);
    }

    // Verifică dacă relația deja există
    const existingRelation = await this.prisma.usersToProjects.findUnique({
      where: {
        project_id_user_id: {
          project_id: createUserToProjectDto.project_id,
          user_id: createUserToProjectDto.user_id,
        },
      },
    });
    if (existingRelation) {
      throw new ConflictException('Utilizatorul este deja asignat acestui proiect');
    }

    return await this.prisma.usersToProjects.create({
      data: {
        project_id: createUserToProjectDto.project_id,
        user_id: createUserToProjectDto.user_id,
        user_role: createUserToProjectDto.user_role,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll() {
    return await this.prisma.usersToProjects.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    if (id <= 0) {
      throw new BadRequestException('ID-ul trebuie să fie un număr pozitiv');
    }

    const relation = await this.prisma.usersToProjects.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    if (!relation) {
      throw new NotFoundException(`Relația cu ID ${id} nu a fost găsită`);
    }
    return relation;
  }

  async findByProject(projectId: number) {
    if (projectId <= 0) {
      throw new BadRequestException('ID-ul proiectului trebuie să fie un număr pozitiv');
    }

    const projectExists = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!projectExists) {
      throw new BadRequestException(`Proiectul cu ID ${projectId} nu există`);
    }

    return await this.prisma.usersToProjects.findMany({
      where: { project_id: projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async findByUser(userId: number) {
    if (userId <= 0) {
      throw new BadRequestException('ID-ul utilizatorului trebuie să fie un număr pozitiv');
    }

    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!userExists) {
      throw new BadRequestException(`Utilizatorul cu ID ${userId} nu există`);
    }

    return await this.prisma.usersToProjects.findMany({
      where: { user_id: userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async update(id: number, updateUserToProjectDto: UpdateUserToProjectDto) {
    const relation = await this.findOne(id);
    if (!relation) {
      throw new NotFoundException(`Relația cu ID ${id} nu a fost găsită`);
    }

    // Validare proiect (dacă se actualizează)
    if (updateUserToProjectDto.project_id && updateUserToProjectDto.project_id !== relation.project_id) {
      const projectExists = await this.prisma.project.findUnique({
        where: { id: updateUserToProjectDto.project_id },
      });
      if (!projectExists) {
        throw new BadRequestException(`Proiectul cu ID ${updateUserToProjectDto.project_id} nu există`);
      }

      // Verifică dacă noua relație nu există deja
      const existingRelation = await this.prisma.usersToProjects.findUnique({
        where: {
          project_id_user_id: {
            project_id: updateUserToProjectDto.project_id,
            user_id: relation.user_id,
          },
        },
      });
      if (existingRelation) {
        throw new ConflictException('Utilizatorul este deja asignat noului proiect');
      }
    }

    // Validare utilizator (dacă se actualizează)
    if (updateUserToProjectDto.user_id && updateUserToProjectDto.user_id !== relation.user_id) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: updateUserToProjectDto.user_id },
      });
      if (!userExists) {
        throw new BadRequestException(`Utilizatorul cu ID ${updateUserToProjectDto.user_id} nu există`);
      }

      // Verifică dacă noua relație nu există deja
      const existingRelation = await this.prisma.usersToProjects.findUnique({
        where: {
          project_id_user_id: {
            project_id: relation.project_id,
            user_id: updateUserToProjectDto.user_id,
          },
        },
      });
      if (existingRelation) {
        throw new ConflictException('Utilizatorul nou este deja asignat acestui proiect');
      }
    }

    return await this.prisma.usersToProjects.update({
      where: { id },
      data: {
        ...(updateUserToProjectDto.project_id && { project_id: updateUserToProjectDto.project_id }),
        ...(updateUserToProjectDto.user_id && { user_id: updateUserToProjectDto.user_id }),
        ...(updateUserToProjectDto.user_role && { user_role: updateUserToProjectDto.user_role }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        user: {
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
    const relation = await this.findOne(id);
    if (!relation) {
      throw new NotFoundException(`Relația cu ID ${id} nu a fost găsită`);
    }

    return await this.prisma.usersToProjects.delete({
      where: { id },
    });
  }
}
