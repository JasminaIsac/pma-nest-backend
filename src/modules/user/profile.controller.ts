import {
  Controller,
  Get,
  Patch,
  Delete,
  BadRequestException,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CloudinaryService } from 'src/common/services/cloudinary.service';
import { memoryStorage } from 'multer';

@ApiTags('profile')
@UseGuards(JwtGuard) 
@Controller('users/me')
export class ProfileController {
  constructor(
    private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obține profilul utilizatorului curent' })
  @ApiResponse({ status: 200, description: 'Profilul utilizatorului' })
  getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.userService.findOne(user.userId);
  }

  @Patch('avatar')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Actualizează avatarul utilizatorului' })
  @ApiResponse({ status: 200, description: 'Avatarul utilizatorului a fost actualizat cu succes' })
  @ApiResponse({ status: 404, description: 'Utilizatorul nu a fost găsit' })  
  @UseInterceptors(FileInterceptor('avatar', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  async updateAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File required');

    const avatarUrl = await this.cloudinaryService.uploadFile(
      file.buffer,
      'project-management-app/avatars',
    );

    return this.userService.updateAvatar(user.userId, avatarUrl);
  }

  @Delete('avatar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Șterge avatarul utilizatorului' })
  @ApiResponse({ status: 200, description: 'Avatarul utilizatorului a fost șters cu succes' })
  @ApiResponse({ status: 404, description: 'Utilizatorul nu a fost găsit' })
  async deleteAvatar(@CurrentUser() user: JwtPayload) {
    return this.userService.updateAvatar(user.userId, null);
  }
}