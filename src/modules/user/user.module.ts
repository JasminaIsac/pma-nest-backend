import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../../../prisma/prisma.service';
import { HashService } from '../auth/services/hash.service';
import { ProfileController } from './profile.controller';
import { CommonModule } from 'src/common/common.module';
import { CloudinaryService } from 'src/common/services/cloudinary.service';

@Module({
  controllers: [UserController, ProfileController],
  providers: [UserService, PrismaService, HashService, CloudinaryService],
  imports: [CommonModule],
})
export class UserModule {}
