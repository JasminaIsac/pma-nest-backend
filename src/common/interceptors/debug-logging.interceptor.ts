import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class DebugLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    const method = request.method;
    const url = request.originalUrl ?? request.url;
    const userId = (request.user as { userId: number })?.userId ?? 'guest';

    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        if (['POST', 'PUT', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
          this.logger.log(
            `[${method}] ${url} | user=${userId} | ${Date.now() - start}ms`,
          );
        }
      }),

      catchError((error: unknown) => {
        const duration = Date.now() - start;

        this.logger.error(
          `[${method}] ${url} | user=${userId} | ${duration}ms`,
          error instanceof Error ? error.stack : undefined,
        );

        throw error;
      }),
    );
  }
}
