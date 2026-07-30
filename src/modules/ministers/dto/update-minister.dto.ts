import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateMinisterDto } from './create-minister.dto';

export class UpdateMinisterDto extends PartialType(
  OmitType(CreateMinisterDto, ['email'] as const),
) {}
