import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { HashService } from './services/hash.service';
import { TokenService } from './services/token.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserStatus } from 'src/generated/prisma/enums';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private hashService: HashService,
    private tokenService: TokenService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: loginDto.email, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await this.hashService.comparePasswords(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    if (user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('User has been deleted');
    }

    const token = this.tokenService.generateToken(user.id, user.email);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userData } = user;
    return {
      userData,
      token,
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    if (!userId) {
      throw new BadRequestException('The user ID must be provided');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`The user with ID ${userId} was not found`);
    }

    if (user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('User has been deleted');
    }

    const isOldPasswordValid = await this.hashService.comparePasswords(
      changePasswordDto.oldPassword,
      user.password,
    );

    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    if (changePasswordDto.newPassword === changePasswordDto.oldPassword) {
      throw new BadRequestException(
        'The new password must be different from the old password',
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
      message: 'Password changed successfully',
    };
  }
}
