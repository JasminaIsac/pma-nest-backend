import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Web Development', minLength: 3, maxLength: 100 })
  @IsString({ message: 'Category name must be text' })
  @IsNotEmpty({ message: 'Category name is required' })
  @MinLength(3, { message: 'Category name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Category name must not exceed 100 characters' })
  name: string;
}
