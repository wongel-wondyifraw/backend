import { Transform, Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  IsOptional,
} from "class-validator";
import { NormalizePersonName } from "../../../common/transformers/normalize-name.decorator";
import { IsFlexibleDate } from "../../../common/validators/flexible-date.validator";
import type {
  CalendarSystem,
  DatePrecision,
} from "../../../common/utils/ethiopian-calendar";

export class CreateFamilyChildDto {
  @NormalizePersonName()
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsFlexibleDate({ allowPartial: true })
  date_of_birth?: string | null;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsIn(["gc", "ec"])
  @IsOptional()
  date_of_birth_calendar?: CalendarSystem;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsIn(["day", "month", "year"])
  @IsOptional()
  date_of_birth_precision?: DatePrecision;
}
