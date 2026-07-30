import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class TaskQueryDto {
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsString()
  @IsOptional()
  search?: string;

  @IsIn(['pending', 'completed', 'cancelled', 'overdue', 'all'])
  @IsOptional()
  status?: 'pending' | 'completed' | 'cancelled' | 'overdue' | 'all' = 'all';

  @IsUUID()
  @IsOptional()
  minister_id?: string;

  @IsUUID()
  @IsOptional()
  definition_id?: string;
}
