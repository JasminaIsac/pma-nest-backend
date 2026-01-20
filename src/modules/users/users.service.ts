import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HashService } from '../auth/services/hash.service';
import { CloudinaryService } from 'src/common/services/cloudinary.service';
import { UserRole, UserStatus } from 'src/generated/prisma/enums';

@Injectable()
export class UsersService {

  constructor(
    private prisma: PrismaService,
    private hashService: HashService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingEmail) {
      throw new ConflictException('This email is already in use');
    }

    const existingPhone = await this.prisma.user.findUnique({
      where: { tel: createUserDto.tel },
    });
    if (existingPhone) {
      throw new ConflictException('This phone number is already in use');
    }

    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(createUserDto.role)) {
      throw new BadRequestException(`Role ${createUserDto.role} is not valid`);
    }

    const hashedPassword = await this.hashService.hashPassword(createUserDto.password);

    return await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        password: hashedPassword,
        role: createUserDto.role,
        tel: createUserDto.tel,
        location: createUserDto.location,
      },
    });
  }

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findAllCursor(limit = 10, cursor?: string) {
    const take = limit + 1;

    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      take,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { id: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tel: true,
        location: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
      },
    });

    const hasMore = users.length > limit;
    const items = hasMore ? users.slice(0, limit) : users;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    };
  }

  async findOne(id: string) {
    if (!id) {
      throw new BadRequestException('ID must be a valid string');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('This email is already in use');
      }
    }

    if (updateUserDto.tel && updateUserDto.tel !== user.tel) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { tel: updateUserDto.tel },
      });
      if (existingPhone) {
        throw new ConflictException('This phone number is already in use');
      }
    }

    return await this.prisma.user.update({
      where: { id },
      data: {
        ...(updateUserDto.email && { email: updateUserDto.email }),
        ...(updateUserDto.name && { name: updateUserDto.name }),
        ...(updateUserDto.role && { role: updateUserDto.role }),
        ...(updateUserDto.tel && { tel: updateUserDto.tel }),
        ...(updateUserDto.location !== undefined && { location: updateUserDto.location }),
      },
    });
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    return await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.DELETED, deletedAt: new Date() },
    });
  }

  async updateAvatar(id: string, avatarUrl: string | null) {
    const user = await this.findOne(id);

    if (user.avatarUrl) {
      try {
        const publicId = this.cloudinaryService.extractPublicId(user.avatarUrl);
        await this.cloudinaryService.deleteFile(publicId);
      } catch (err) {
        console.error('Could not delete old avatar from Cloudinary:', err);
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { avatarUrl },
      select: { avatarUrl: true },
    });
  }
}
