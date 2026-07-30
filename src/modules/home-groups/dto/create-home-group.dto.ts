import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';

export class CreateHomeGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  about?: string;

  @IsString()
  @IsOptional()
  schedule?: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsUUID()
  @IsOptional()
  leader_id?: string | null;

  @ValidateIf((o: CreateHomeGroupDto) => !!o.leader_id)
  @IsIn(['member', 'minister'])
  @IsOptional()
  leader_type?: 'member' | 'minister' | null;
}
