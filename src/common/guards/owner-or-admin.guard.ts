import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from 'src/generated/prisma/enums';
import { Request } from 'express';

interface AuthenticatedUser {
  userId: string;
  role: UserRole;
  email: string;
}

interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class OwnerOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    
    const targetId = request.params.id;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const isPrivileged = 
      user.role === UserRole.ROOT || 
      user.role === UserRole.ADMIN;

    if (isPrivileged) {
      return true;
    }

    const isOwner = String(user.userId) === String(targetId);

    if (isOwner) return true;

    throw new ForbiddenException(
      'You do not have permission to access or modify this resource',
    );
  }
}