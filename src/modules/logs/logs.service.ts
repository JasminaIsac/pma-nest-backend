import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateLogDto } from './dto/create-log.dto';
import { LogEntity } from 'src/generated/prisma/client';

@Injectable()
export class LogsService {
constructor(
  private readonly prisma: PrismaService
) {}
  async createLog(createLogDto: CreateLogDto) {
    return this.prisma.log.create({
      data: {
        entity: createLogDto.entity,
        entityId: createLogDto.entityId ?? null,
        action: createLogDto.action,

        before: createLogDto.before
          ? JSON.stringify(createLogDto.before)
          : null,

        after: createLogDto.after
          ? JSON.stringify(createLogDto.after)
          : null,

        user: {
          connect: {
            id: createLogDto.userId,
          },
        },
      },
    });
  }

  async findAll(page = 1, limit = 10) {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException('Page and limit must be positive numbers');
    }

    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.log.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.log.count(),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async findByEntity(entity: LogEntity, entityId?: string | null) {
    return this.prisma.log.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
