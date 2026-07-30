import { PartialType } from '@nestjs/mapped-types';
import { CreateBibleStudyDto } from './create-bible-study.dto';

export class UpdateBibleStudyDto extends PartialType(CreateBibleStudyDto) {}
