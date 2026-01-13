import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { HashService } from '../auth/services/hash.service';
import { ProfileController } from './profile.controller';
import { CommonModule } from 'src/common/common.module';
import { CloudinaryService } from 'src/common/services/cloudinary.service';

@Module({
  controllers: [UsersController, ProfileController],
  providers: [UsersService, HashService, CloudinaryService],
  imports: [CommonModule],
})
export class UsersModule {}
