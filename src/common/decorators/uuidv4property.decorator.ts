import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

interface UUIDv4Options {
  example?: string;
  required?: boolean;
}

export function UUIDv4Property(options: UUIDv4Options = {}) {
  const {
    example = '550e8400-e29b-41d4-a716-446655440000',
    required = true,
  } = options;

  return applyDecorators(
    required
      ? ApiProperty({ example })
      : ApiPropertyOptional({ example }),

    required
      ? IsNotEmpty({ message: 'Field is required' })
      : IsOptional(),

    IsUUID('4', { message: 'Must be a valid UUID v4' }),
  );
}
