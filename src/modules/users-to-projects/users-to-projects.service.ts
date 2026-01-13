import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserToProjectDto } from './dto/create-user-to-project.dto';
import { UpdateUserToProjectDto } from './dto/update-user-to-project.dto';

@Injectable()
export class UsersToProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createUserToProjectDto: CreateUserToProjectDto) {
    const projectExists = await this.prisma.project.findUnique({
      where: { id: createUserToProjectDto.projectId },
    });
    if (!projectExists) {
      throw new BadRequestException(`The project with ID ${createUserToProjectDto.projectId} does not exist`);
    }

    const userExists = await this.prisma.user.findUnique({
      where: { id: createUserToProjectDto.userId },
    });
    if (!userExists) {
      throw new BadRequestException(`The user with ID ${createUserToProjectDto.userId} does not exist`);
    }

    const existingRelation = await this.prisma.usersToProjects.findUnique({
      where: {
        projectId_userId: {
          projectId: createUserToProjectDto.projectId,
          userId: createUserToProjectDto.userId,
        },
      },
    });
    if (existingRelation) {
      throw new ConflictException('The user is already assigned to this project');
    }

    return await this.prisma.usersToProjects.create({
      data: {
        projectId: createUserToProjectDto.projectId,
        userId: createUserToProjectDto.userId,
        userRole: createUserToProjectDto.userRole,
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    if (id <= 0) {
      throw new BadRequestException('The relation ID must be a positive integer');
    }

    const relation = await this.prisma.usersToProjects.findFirst({
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
      throw new NotFoundException(`The relation with ID ${id} was not found`);
    }
    return relation;
  }

  async findByProject(projectId: number) {
    if (projectId <= 0) {
      throw new BadRequestException('The project ID must be a positive integer');
    }

    const projectExists = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!projectExists) {
      throw new BadRequestException(`The project with ID ${projectId} does not exist`);
    }

    return await this.prisma.usersToProjects.findMany({
      where: { projectId: projectId },
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
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByUser(userId: number) {
    if (userId <= 0) {
      throw new BadRequestException('The user ID must be a positive integer');
    }

    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!userExists) {
      throw new BadRequestException(`User with ID ${userId} does not exist`);
    }

    return await this.prisma.usersToProjects.findMany({
      where: { userId: userId },
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
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: number, updateUserToProjectDto: UpdateUserToProjectDto) {
    const relation = await this.findOne(id);
    if (!relation) {
      throw new NotFoundException(`The relation with ID ${id} was not found`);
    }

    if (updateUserToProjectDto.projectId && updateUserToProjectDto.projectId !== relation.projectId) {
      const projectExists = await this.prisma.project.findUnique({
        where: { id: updateUserToProjectDto.projectId },
      });
      if (!projectExists) {
        throw new BadRequestException(`The project with ID ${updateUserToProjectDto.projectId} does not exist`);
      }

      const existingRelation = await this.prisma.usersToProjects.findUnique({
        where: {
          projectId_userId: {
            projectId: updateUserToProjectDto.projectId,
            userId: relation.userId,
          },
        },
      });
      if (existingRelation) {
        throw new ConflictException('User is already assigned to the new project');
      }
    }

    if (updateUserToProjectDto.userId && updateUserToProjectDto.userId !== relation.userId) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: updateUserToProjectDto.userId },
      });
      if (!userExists) {
        throw new BadRequestException(`User with ID ${updateUserToProjectDto.userId} does not exist`);
      }

      const existingRelation = await this.prisma.usersToProjects.findUnique({
        where: {
          projectId_userId: {
            projectId: relation.projectId,
            userId: updateUserToProjectDto.userId,
          },
        },
      });
      if (existingRelation) {
        throw new ConflictException('User is already assigned to this project');
      }
    }

    return await this.prisma.usersToProjects.update({
      where: { id },
      data: {
        ...(updateUserToProjectDto.projectId && { projectId: updateUserToProjectDto.projectId }),
        ...(updateUserToProjectDto.userId && { userId: updateUserToProjectDto.userId }),
        ...(updateUserToProjectDto.userRole && { userRole: updateUserToProjectDto.userRole }),
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
      throw new NotFoundException(`The relation with ID ${id} was not found`);
    }

    return await this.prisma.usersToProjects.delete({
      where: { id },
    });
  }
}
