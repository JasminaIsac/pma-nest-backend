import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  IsInt,
  IsPositive,
  IsISO8601,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implementare autentificare', minLength: 3, maxLength: 200 })
  @IsString({ message: 'Titlul trebuie să fie text' })
  @IsNotEmpty({ message: 'Titlul este obligatoriu' })
  @MinLength(3, { message: 'Titlul trebuie să aibă cel puțin 3 caractere' })
  @MaxLength(200, { message: 'Titlul nu poate depăși 200 caractere' })
  title: string;

  @ApiProperty({ example: 'Implementarea sistemului de autentificare cu JWT', required: false, maxLength: 1000 })
  @IsString({ message: 'Descrierea trebuie să fie text' })
  @IsOptional()
  @MaxLength(1000, { message: 'Descrierea nu poate depăși 1000 caractere' })
  description?: string;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'ID-ul proiectului trebuie să fie un număr întreg' })
  @IsPositive({ message: 'ID-ul proiectului trebuie să fie pozitiv' })
  @IsNotEmpty({ message: 'ID-ul proiectului este obligatoriu' })
  project_id: number;

  @ApiProperty({ example: 'high', enum: ['low', 'medium', 'high'], default: 'medium' })
  @IsEnum(['low', 'medium', 'high'], { message: 'Prioritatea trebuie să fie: low, medium sau high' })
  @IsOptional()
  priority?: TaskPriority;

  @ApiProperty({ example: 2 })
  @IsInt({ message: 'ID-ul utilizatorului trebuie să fie un număr întreg' })
  @IsPositive({ message: 'ID-ul utilizatorului trebuie să fie pozitiv' })
  @IsNotEmpty({ message: 'ID-ul utilizatorului este obligatoriu' })
  assigned_to: number;

  @ApiProperty({ example: '2026-02-15T10:00:00Z' })
  @IsISO8601({ strict: true }, { message: 'Data deadline-ului trebuie să fie în format ISO8601' })
  @IsNotEmpty({ message: 'Data deadline-ului este obligatorie' })
  deadline: string;

  @ApiProperty({ example: 'new', enum: ['new', 'in progress', 'paused', 'to check', 'completed'], default: 'new' })
  @IsEnum(['new', 'in progress', 'paused', 'to check', 'completed'], { 
    message: 'Statusul trebuie să fie: new, in progress, paused, to check sau completed' 
  })
  @IsOptional()
  status?: TaskStatus;
}
