import { Transform } from "class-transformer";
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from "class-validator";
import { IsFlexibleDate } from "../../../common/validators/flexible-date.validator";
import type { CalendarSystem } from "../../../common/utils/ethiopian-calendar";

export class CreateTaskDto {
  @IsUUID()
  definition_id: string;

  @IsUUID()
  minister_id: string;

  @IsString()
  @IsNotEmpty()
  @IsFlexibleDate({ allowPartial: false, calendarField: "date_calendar" })
  start_date: string;

  @IsString()
  @IsNotEmpty()
  @IsFlexibleDate({ allowPartial: false, calendarField: "date_calendar" })
  end_date: string;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsIn(["gc", "ec"])
  @IsOptional()
  date_calendar?: CalendarSystem;

  @ValidateIf((o: CreateTaskDto) => !!o.target_member_id)
  @IsUUID()
  @IsOptional()
  target_member_id?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString({ each: true })
  @IsOptional()
  visitation_methods?: string[];
}
