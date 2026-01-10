import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'Project Alpha', minLength: 3, maxLength: 255 })
  @IsString({ message: 'Numele proiectului trebuie să fie text' })
  @IsNotEmpty({ message: 'Numele proiectului este obligatoriu' })
  @MinLength(3, { message: 'Numele proiectului trebuie să aibă cel puțin 3 caractere' })
  @MaxLength(255, { message: 'Numele proiectului nu poate depăși 255 caractere' })
  name: string;

  @ApiProperty({ example: 'This is a sample project', required: false, maxLength: 1000 })
  @IsString({ message: 'Descrierea trebuie să fie text' })
  @IsOptional()
  @MaxLength(1000, { message: 'Descrierea nu poate depăși 1000 caractere' })
  description?: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsNumber({}, { message: 'ID-ul categoriei trebuie să fie număr' })
  @IsNotEmpty({ message: 'ID-ul categoriei este obligatoriu' })
  @Min(1, { message: 'ID-ul categoriei trebuie să fie mai mare ca 0' })
  category_id: number;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsNumber({}, { message: 'ID-ul managerului trebuie să fie număr' })
  @IsNotEmpty({ message: 'ID-ul managerului este obligatoriu' })
  @Min(1, { message: 'ID-ul managerului trebuie să fie mai mare ca 0' })
  manager_id: number;

  @ApiProperty({ example: '2025-12-31T23:59:59Z', required: false })
  @IsOptional()
  @IsDateString({}, { message: 'Data trebuie să fie într-un format valid ISO 8601' })
  deadline?: string;
}
