import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, from, lastValueFrom } from 'rxjs';
import { tap, mergeMap } from 'rxjs/operators';
import { LogsService } from 'src/modules/logs/logs.service';
import { PrismaService } from 'prisma/prisma.service';
import { LOG_METADATA_KEY, LogMetadata } from 'src/common/decorators/log-action.decorator';
import { LogAction } from 'src/generated/prisma/client';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly logsService: LogsService,
    private readonly prisma: PrismaService, // Avem nevoie de el pentru "before"
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const metadata = this.reflector.get<LogMetadata | undefined>(LOG_METADATA_KEY, context.getHandler());

    if (!metadata || metadata.action !== LogAction.UPDATE) {
      // Dacă nu e UPDATE, mergem direct mai departe și lăsăm before/after null
      return next.handle().pipe(
        tap((responseData) => this.saveSimpleLog(request, metadata, responseData))
      );
    }

    // --- LOGICA SPECIFICĂ PENTRU UPDATE ---
    const entityId = Number(request.params.id);
    let beforeData: any = null;

    if (entityId) {
      // Luăm obiectul de dinainte de update
      // Folosim table name din metadata.entity (asigură-te că LogEntity coincide cu numele modelului Prisma)
      const modelName = metadata.entity.toLowerCase();
      beforeData = await (this.prisma as any)[modelName].findUnique({ where: { id: entityId } });
    }

    return next.handle().pipe(
      tap((afterData) => {
        const user = request.user as { id: number } | undefined;
        if (user?.id) {
          void this.logsService.createLog({
            userId: user.id,
            entity: metadata.entity,
            entityId: entityId || (afterData as any)?.id,
            action: LogAction.UPDATE,
            before: beforeData, // Starea veche din DB
            after: afterData,   // Starea nouă returnată de controller
          });
        }
      }),
    );
  }

  // Metodă simplificată pentru CREATE / DELETE (unde before/after sunt null)
  private saveSimpleLog(request: Request, metadata: LogMetadata | undefined, responseData: unknown) {
    const user = request.user as { id: number } | undefined;
    if (!metadata || !user?.id) return;

    void this.logsService.createLog({
      userId: user.id,
      entity: metadata.entity,
      entityId: this.extractId(responseData, request),
      action: metadata.action,
      before: null,
      after: null,
    });
  }

  private extractId(data: unknown, request: Request): number | null {
    if (data && typeof data === 'object' && 'id' in data) {
      return Number((data as { id: any }).id) || null;
    }
    return Number(request.params.id) || null;
  }
}