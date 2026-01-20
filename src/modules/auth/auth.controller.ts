import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtGuard } from './guards/jwt.guard';
import { LogActivity } from 'src/common/decorators/log-action.decorator';
import { JwtPayload } from '../auth/decorators/current-user.decorator';
import { LogEntity, LogAction } from 'src/generated/prisma/client';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @LogActivity(LogEntity.USER, LogAction.LOGIN)
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: 200, description: 'Succesfully logged' })
  @ApiResponse({ status: 401, description: 'Email or password incorrect' })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('change-password')
  @UseGuards(JwtGuard)
  @LogActivity(LogEntity.USER, LogAction.UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password successfully changed' })
  @ApiResponse({ status: 401, description: 'Incorrect old password' })
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return await this.authService.changePassword(req.user.userId, changePasswordDto);
  }
}
