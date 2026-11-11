import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";
import { IsFlexibleDate } from "../../../common/validators/flexible-date.validator";
import type { CalendarSystem } from "../../../common/utils/ethiopian-calendar";

export class MemberListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  marital_status?: string;

  @IsOptional()
  @IsFlexibleDate({ allowPartial: true, calendarField: "joined_calendar" })
  joined_from?: string;

  @IsOptional()
  @IsFlexibleDate({ allowPartial: true, calendarField: "joined_calendar" })
  joined_to?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsIn(["gc", "ec"])
  joined_calendar?: CalendarSystem;

  @IsOptional()
  @IsIn(["created_at", "joined_date", "visit_count"])
  sort_by?: "created_at" | "joined_date" | "visit_count";

  @IsOptional()
  @IsIn(["ASC", "DESC", "asc", "desc"])
  sort_order?: "ASC" | "DESC" | "asc" | "desc";
}
