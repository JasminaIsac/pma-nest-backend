import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HashService } from '../auth/services/hash.service';
import { CloudinaryService } from '../../common/services/cloudinary.service';

@Injectable()
export class UserService {

  constructor(
    private prisma: PrismaService,
    private hashService: HashService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // Validare email unic
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Un utilizator cu acest email există deja');
    }

    // Validare telefon unic
    const existingPhone = await this.prisma.user.findUnique({
      where: { tel: createUserDto.tel },
    });
    if (existingPhone) {
      throw new ConflictException('Un utilizator cu acest telefon există deja');
    }

    // Validare rol valid
    const validRoles = ['root', 'admin', 'project_manager', 'developer'];
    if (!validRoles.includes(createUserDto.role)) {
      throw new BadRequestException(`Rolul ${createUserDto.role} nu este valid`);
    }

    // Hash parola
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

  async findOne(id: number) {
    if (id <= 0) {
      throw new BadRequestException('ID-ul trebuie să fie un număr pozitiv');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`Utilizatorul cu ID ${id} nu a fost găsit`);
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException(`Utilizatorul cu ID ${id} nu a fost găsit`);

    // Validare email unic (dacă se actualizează)
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Un utilizator cu acest email există deja');
      }
    }

    // Validare telefon unic (dacă se actualizează)
    if (updateUserDto.tel && updateUserDto.tel !== user.tel) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { tel: updateUserDto.tel },
      });
      if (existingPhone) {
        throw new ConflictException('Un utilizator cu acest telefon există deja');
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

  async remove(id: number) {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException(`Utilizatorul cu ID ${id} nu a fost găsit`);

    return await this.prisma.user.delete({
      where: { id },
    });
  }

  async updateAvatar(id: number, avatarUrl: string | null) {
    const user = await this.findOne(id);

    if (user.avatarUrl) {
      try {
        const publicId = this.cloudinaryService.extractPublicId(user.avatarUrl);
        await this.cloudinaryService.deleteFile(publicId);
      } catch (err) {
        console.error('Nu am putut șterge avatarul vechi din Cloudinary:', err);
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { avatarUrl },
      select: { avatarUrl: true },
    });
  }
}
