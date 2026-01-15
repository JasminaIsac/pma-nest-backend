import { SetMetadata } from '@nestjs/common';
import { LogAction, LogEntity } from 'src/generated/prisma/client';

export const LOG_METADATA_KEY = 'log_metadata';

export interface LogMetadata {
  entity: LogEntity;
  action: LogAction;
}

export const LogActivity = (entity: LogEntity, action: LogAction) => 
  SetMetadata<string, LogMetadata>(LOG_METADATA_KEY, { entity, action });