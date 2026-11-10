import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { IsFlexibleDate } from "../../../common/validators/flexible-date.validator";
import type { CalendarSystem } from "../../../common/utils/ethiopian-calendar";
import { PLAN_TYPES } from "./create-plan.dto";

export class PlanListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn([...PLAN_TYPES])
  type?: (typeof PLAN_TYPES)[number];

  @IsOptional()
  @IsFlexibleDate({ allowPartial: true, calendarField: "calendar" })
  from?: string;

  @IsOptional()
  @IsFlexibleDate({ allowPartial: true, calendarField: "calendar" })
  to?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsIn(["gc", "ec"])
  calendar?: CalendarSystem;

  @IsOptional()
  @IsString()
  status?: string;
}
