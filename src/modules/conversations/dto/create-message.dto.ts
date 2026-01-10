import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsPositive,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ example: 1, description: 'ID-ul conversației' })
  @IsInt({ message: 'ID-ul conversației trebuie să fie un număr întreg' })
  @IsPositive({ message: 'ID-ul conversației trebuie să fie pozitiv' })
  @IsNotEmpty({ message: 'ID-ul conversației este obligatoriu' })
  conversation_id: number;

  @ApiProperty({ example: 'Salut, cum merge proiectul?' })
  @IsString({ message: 'Mesajul trebuie să fie text' })
  @IsNotEmpty({ message: 'Mesajul este obligatoriu' })
  @MinLength(1, { message: 'Mesajul trebuie să aibă cel puțin 1 caracter' })
  @MaxLength(5000, { message: 'Mesajul nu poate depăși 5000 caractere' })
  message: string;
}
