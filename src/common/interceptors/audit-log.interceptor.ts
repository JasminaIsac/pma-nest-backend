 /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { Request } from 'express';
// import { Observable } from 'rxjs';
// import { tap } from 'rxjs/operators';
// import { LogsService } from 'src/modules/logs/logs.service';
// import { LOG_METADATA_KEY, LogMetadata } from 'src/common/decorators/log-action.decorator';

// @Injectable()
// export class LoggingInterceptor implements NestInterceptor {
//   constructor(
//     private readonly reflector: Reflector,
//     private readonly logsService: LogsService,
//   ) {}

//   intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
//     const request = context.switchToHttp().getRequest<Request>();
    
//     // Citim metadatele folosind interfața pentru a evita "any" sau "error type"
//     const metadata = this.reflector.get<LogMetadata | undefined>(
//       LOG_METADATA_KEY,
//       context.getHandler(),
//     );

//     return next.handle().pipe(
//       tap((responseData: unknown) => {
//         // Dacă nu avem metadate, decidem dacă logăm ceva default sau ignorăm
//         if (!metadata) return;

//         // Extragem user-ul din request (pus de JwtGuard)
//         // Folosim un cast safe pentru a evita ESLint errors
//         const user = request.user as { id: number } | undefined;
//         const userId = user?.id;

//         if (userId) {
//           // Trimitem către service fără await pentru a nu bloca răspunsul HTTP
//           void this.logsService.createLog({
//             userId: userId,
//             entity: metadata.entity,
//             entityId: this.extractId(responseData, request),
//             action: metadata.action,
//             before: request.body,
//             after: responseData,
//           });
//         }
//       }),
//     );
//   }

//   private extractId(data: unknown, request: Request): number | null {
//     // 1. Încercăm să luăm ID-ul din răspunsul bazei de date
//     if (data && typeof data === 'object' && 'id' in data) {
//       const id = (data as { id: unknown }).id;
//       return typeof id === 'number' ? id : null;
//     }
//     // 2. Fallback la ID-ul din URL (ex: la UPDATE sau DELETE)
//     if (request.params.id) {
//       return Number(request.params.id) || null;
//     }
//     return null;
//   }
// }

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