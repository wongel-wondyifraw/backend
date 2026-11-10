import { Transform } from "class-transformer";
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
} from "class-validator";
import { IsFlexibleDate } from "../../../common/validators/flexible-date.validator";
import type { CalendarSystem } from "../../../common/utils/ethiopian-calendar";

export class UpdateTaskDto {
  @IsUUID()
  @IsOptional()
  minister_id?: string;

  @IsFlexibleDate({ allowPartial: false, calendarField: "date_calendar" })
  @IsOptional()
  start_date?: string;

  @IsFlexibleDate({ allowPartial: false, calendarField: "date_calendar" })
  @IsOptional()
  end_date?: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsIn(["gc", "ec"])
  @IsOptional()
  date_calendar?: CalendarSystem;

  @IsUUID()
  @IsOptional()
  target_member_id?: string | null;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  visitation_methods?: string[];

  @IsIn(["pending", "completed", "cancelled"])
  @IsOptional()
  status?: "pending" | "completed" | "cancelled";
}
