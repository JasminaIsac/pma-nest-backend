import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LogsService } from 'src/modules/logs/logs.service';
import { PrismaService } from 'prisma/prisma.service';
import { LOG_METADATA_KEY, LogMetadata } from 'src/common/decorators/log-action.decorator';
import { LogAction } from 'src/generated/prisma/client';

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

const logEntityToModel: Record<string, keyof PrismaService> = {
  PROJECT: 'project',
  TASK: 'task',
  USER: 'user',
  CATEGORY: 'category',
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly logsService: LogsService,
    private readonly prisma: PrismaService,
  ) {}

  async intercept(
  context: ExecutionContext,
  next: CallHandler,
): Promise<Observable<unknown>> {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  const metadata = this.reflector.get<LogMetadata | undefined>(
    LOG_METADATA_KEY,
    context.getHandler(),
  );

  // Dacă nu avem metadata sau nu e UPDATE
  if (!metadata || metadata.action !== LogAction.UPDATE) {
    return next.handle().pipe(
      tap((responseData) =>
        this.saveSimpleLog(request, metadata, responseData),
      ),
    );
  }

  // -------- UPDATE cu before / after --------
  const param = request.params?.id;
  const entityId: string | null = Array.isArray(param) ? param[0] : param ?? null;
  let beforeData: unknown = null;

  if (entityId) {
    const modelName = logEntityToModel[metadata.entity];
    const modelDelegate = this.prisma[modelName] as unknown;
    const model = modelDelegate as { findUnique: (args: { where: { id: string } }) => Promise<unknown> } | undefined;

    if (model) {
      beforeData = await model.findUnique({ where: { id: entityId } });
    }
  }

  return next.handle().pipe(
    tap((afterData) => {
      const userId = request.user?.id;
      if (!userId) return;

      void this.logsService.createLog({
        userId,
        entity: metadata.entity,
        entityId: entityId,
        action: LogAction.UPDATE,
        before: beforeData,
        after: afterData,
      });
    }),
  );
}

  // CREATE / DELETE (fara before / after)
  private saveSimpleLog(
    request: AuthenticatedRequest,
    metadata: LogMetadata | undefined,
    responseData: unknown,
  ) {
    const userId = request.user?.id;
    if (!metadata || !userId) return;

    void this.logsService.createLog({
      userId,
      entity: metadata.entity,
      entityId: this.extractId(responseData, request),
      action: metadata.action,
      before: null,
      after: null,
    });
  }

  private extractId(
    data: unknown,
    request: Request,
  ): string | null {
    // Daca data are id de tip string
    if (
      data &&
      typeof data === 'object' &&
      'id' in data &&
      typeof (data as { id?: unknown }).id === 'string'
    ) {
      return (data as { id: string }).id;
    }

    // Altfel, convertim la string daca e array
    const param = request.params?.id;
    if (!param) return null;
    return Array.isArray(param) ? param[0] : param;
  }
}