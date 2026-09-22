import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @IsOptional()
  @IsUUID()
  parent_id?: string;
}
