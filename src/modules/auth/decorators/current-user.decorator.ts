import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from 'src/generated/prisma/enums';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    return request.user;
  },
);
