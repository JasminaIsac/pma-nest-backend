import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Web Development', minLength: 3, maxLength: 100 })
  @IsString({ message: 'Titlul categoriei trebuie să fie text' })
  @IsNotEmpty({ message: 'Titlul categoriei este obligatoriu' })
  @MinLength(3, { message: 'Titlul categoriei trebuie să aibă cel puțin 3 caractere' })
  @MaxLength(100, { message: 'Titlul categoriei nu poate depăși 100 caractere' })
  title: string;
}
