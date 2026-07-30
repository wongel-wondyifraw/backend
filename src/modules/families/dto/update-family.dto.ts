import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateFamilyDto {
  @IsUUID()
  @IsOptional()
  husband_id?: string;

  @IsIn(['member', 'minister'])
  @IsOptional()
  husband_type?: 'member' | 'minister';

  @IsUUID()
  @IsOptional()
  wife_id?: string;

  @IsIn(['member', 'minister'])
  @IsOptional()
  wife_type?: 'member' | 'minister';

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
