import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDefinitionDto } from './create-task-definition.dto';

export class UpdateTaskDefinitionDto extends PartialType(CreateTaskDefinitionDto) {}
