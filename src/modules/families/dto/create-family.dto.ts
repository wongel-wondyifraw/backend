import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFamilyDto {
  @IsUUID()
  husband_id: string;

  @IsIn(['member', 'minister'])
  husband_type: 'member' | 'minister';

  @IsUUID()
  wife_id: string;

  @IsIn(['member', 'minister'])
  wife_type: 'member' | 'minister';

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
