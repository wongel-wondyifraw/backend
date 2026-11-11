import { Transform } from "class-transformer";
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import {
  NormalizePersonName,
  NormalizeTitleInitials,
} from "../../../common/transformers/normalize-name.decorator";
import { IsFlexibleDate } from "../../../common/validators/flexible-date.validator";
import type {
  CalendarSystem,
  DatePrecision,
} from "../../../common/utils/ethiopian-calendar";

export class CreateMinisterDto {
  @NormalizePersonName()
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @NormalizePersonName()
  @IsString()
  @IsOptional()
  middle_name?: string;

  @NormalizePersonName()
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsFlexibleDate({ allowPartial: true })
  @IsOptional()
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

  @IsString()
  @IsOptional()
  marital_status?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @NormalizeTitleInitials()
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsFlexibleDate({ allowPartial: true })
  @IsOptional()
  joined_date?: string | null;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsIn(["gc", "ec"])
  @IsOptional()
  joined_date_calendar?: CalendarSystem;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsIn(["day", "month", "year"])
  @IsOptional()
  joined_date_precision?: DatePrecision;
}
