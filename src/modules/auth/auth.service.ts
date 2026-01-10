import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { HashService } from './services/hash.service';
import { TokenService } from './services/token.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private hashService: HashService,
    private tokenService: TokenService,
  ) {}

  async login(loginDto: LoginDto) {
    // Caută utilizatorul după email
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email sau parolă incorectă');
    }

    // Compară parolele
    const isPasswordValid = await this.hashService.comparePasswords(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email sau parolă incorectă');
    }

    // Verifică dacă utilizatorul este activ
    if (user.status !== 'active') {
      throw new UnauthorizedException('Contul dvs. nu este activ');
    }

    // Generează token JWT
    const token = this.tokenService.generateToken(user.id, user.email);

    // Returnează datele utilizatorului (fără parolă) și token
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userData } = user;
    return {
      userData,
      token,
    };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    if (userId <= 0) {
      throw new BadRequestException('ID-ul utilizatorului trebuie să fie un număr pozitiv');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilizatorul nu a fost găsit');
    }

    const isOldPasswordValid = await this.hashService.comparePasswords(
      changePasswordDto.oldPassword,
      user.password,
    );

    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Parola veche nu este corectă');
    }

    if (changePasswordDto.newPassword === changePasswordDto.oldPassword) {
      throw new BadRequestException(
        'Parola nouă trebuie să fie diferită de parola veche',
      );
    }

    const hashedPassword = await this.hashService.hashPassword(
      changePasswordDto.newPassword,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: 'Parola a fost schimbată cu succes',
    };
  }
}
