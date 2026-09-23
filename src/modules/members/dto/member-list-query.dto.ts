import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class MemberListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  marital_status?: string;

  @IsOptional()
  @IsDateString()
  joined_from?: string;

  @IsOptional()
  @IsDateString()
  joined_to?: string;

  @IsOptional()
  @IsIn(['created_at', 'joined_date', 'visit_count'])
  sort_by?: 'created_at' | 'joined_date' | 'visit_count';

  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  sort_order?: 'ASC' | 'DESC' | 'asc' | 'desc';
}
