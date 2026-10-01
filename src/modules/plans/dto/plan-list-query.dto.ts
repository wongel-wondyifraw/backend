import { IsDateString, IsIn, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { PLAN_TYPES } from "./create-plan.dto";

export class PlanListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn([...PLAN_TYPES])
  type?: (typeof PLAN_TYPES)[number];

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
