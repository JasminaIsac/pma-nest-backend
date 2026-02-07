import { Request } from 'express';
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from 'src/generated/prisma/enums';

interface RequestUser {
  role: UserRole;
}

interface AuthRequest extends Request {
  user: RequestUser;
}
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const user = req.user;
    
    if (!user) {
      throw new ForbiddenException('No user authenticated!');
    }
    if (user.role === UserRole.ROOT) {
      return true;
    }
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission for this action!');
    }
    return true;
  }
}
