// backend/src/members/dto/create-member.dto.ts

import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsIn,
} from "class-validator";
import { Transform } from "class-transformer";
import {
  NormalizePersonName,
  NormalizeTitleInitials,
} from "../../../common/transformers/normalize-name.decorator";
import { IsFlexibleDate } from "../../../common/validators/flexible-date.validator";
import type {
  CalendarSystem,
  DatePrecision,
} from "../../../common/utils/ethiopian-calendar";

export class CreateMemberDto {
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
  @IsOptional()
  email?: string;

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

  @IsString()
  @IsOptional()
  status?: string;

  /**
   * baptized is sent as a string "yes"/"no" or "true"/"false" via FormData.
   * This @Transform logic converts it to a real Boolean before @IsBoolean checks it.
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === "yes") return true;
    if (value === "false" || value === "no") return false;
    return value;
  })
  @IsBoolean()
  baptized?: boolean;

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

  @IsString()
  @IsOptional()
  telegram_username?: string;

  @IsString()
  @IsOptional()
  facebook_username?: string;

  @IsString()
  @IsOptional()
  instagram_username?: string;

  @IsString()
  @IsOptional()
  whatsapp_number?: string;

  @IsString()
  @IsOptional()
  member_type?: string;

  @IsString()
  @IsOptional()
  recommendation_letter_url?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === "yes") return true;
    if (value === "false" || value === "no") return false;
    return value;
  })
  @IsBoolean()
  requires_follow_up?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === "yes") return true;
    if (value === "false" || value === "no") return false;
    return value;
  })
  @IsBoolean()
  holy_spirit_baptized?: boolean;

  @IsFlexibleDate({ allowPartial: true })
  @IsOptional()
  salvation_date?: string | null;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsIn(["gc", "ec"])
  @IsOptional()
  salvation_date_calendar?: CalendarSystem;

  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsIn(["day", "month", "year"])
  @IsOptional()
  salvation_date_precision?: DatePrecision;

  @IsString()
  @IsOptional()
  location_id?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === "yes") return true;
    if (value === "false" || value === "no") return false;
    return value;
  })
  @IsBoolean()
  is_deacon?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  ministry_ids?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interested_ministries?: string[];

  @IsString()
  @IsOptional()
  employment_status?: string;

  @NormalizeTitleInitials()
  @IsString()
  @IsOptional()
  profession?: string;

  @NormalizeTitleInitials()
  @IsString()
  @IsOptional()
  employer?: string;

  @IsString()
  @IsOptional()
  education_level?: string;

  @NormalizeTitleInitials()
  @IsString()
  @IsOptional()
  education_field?: string;
}
