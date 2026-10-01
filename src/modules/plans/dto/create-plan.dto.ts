import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from "class-validator";

export const PLAN_TYPES = [
  "program",
  "crusade",
  "general_assembly",
  "training",
  "fasting_day",
  "gospel_campaign",
] as const;

export const PLAN_STATUSES = ["planned", "completed", "cancelled"] as const;

/** HH:mm or HH:mm:ss */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsIn(PLAN_TYPES)
  type: (typeof PLAN_TYPES)[number];

  @IsDateString()
  plan_date: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: "start_time must be HH:mm or HH:mm:ss" })
  start_time?: string | null;

  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: "end_time must be HH:mm or HH:mm:ss" })
  end_time?: string | null;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsIn(PLAN_STATUSES)
  status?: (typeof PLAN_STATUSES)[number];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  minister_ids?: string[];
}
