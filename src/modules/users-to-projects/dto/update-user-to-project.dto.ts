import { PartialType } from '@nestjs/mapped-types';
import { CreateUserToProjectDto } from './create-user-to-project.dto';

export class UpdateUserToProjectDto extends PartialType(CreateUserToProjectDto) {}
