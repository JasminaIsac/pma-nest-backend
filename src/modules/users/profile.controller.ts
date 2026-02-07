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
import { UsersService } from './users.service';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CloudinaryService } from 'src/common/services/cloudinary.service';
import { memoryStorage } from 'multer';
import { LogActivity } from 'src/common/decorators/log-action.decorator';
import { LogEntity, LogAction } from 'src/generated/prisma/client';

@ApiTags('My profile')
@UseGuards(JwtGuard) 
@Controller('me')
export class ProfileController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    if (!user || !user.userId) {
      console.error('❌ ERROR: user sau user.userId este undefined');
      throw new BadRequestException('Invalid token payload');
    }
    return await this.usersService.findOne(user.userId);
  }

  @Patch('avatar')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @LogActivity(LogEntity.USER, LogAction.UPDATE)
  @ApiOperation({ summary: 'Update user avatar' })
  @ApiResponse({ status: 200, description: 'User avatar updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
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

    return this.usersService.updateAvatar(user.userId, avatarUrl);
  }

  @Delete('avatar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user avatar' })
  @ApiResponse({ status: 200, description: 'User avatar deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deleteAvatar(@CurrentUser() user: JwtPayload) {
    return this.usersService.updateAvatar(user.userId, null);
  }
}