import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

/** Nested shape aligned with frontend LandingPageContent. */
export class LandingSectionDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  kicker?: string;

  @IsOptional()
  @IsString()
  lede?: string;

  @IsOptional()
  @IsString()
  image_url?: string | null;

  @IsOptional()
  @IsString()
  video_url?: string | null;

  @IsOptional()
  @IsString()
  video_file_url?: string | null;

  @IsOptional()
  @IsString()
  file_url?: string | null;

  @IsOptional()
  @IsString()
  file_name?: string | null;

  @IsOptional()
  @IsString()
  cta_label?: string;

  @IsOptional()
  @IsString()
  secondary_cta_label?: string;

  @IsOptional()
  @IsString()
  verse_ref?: string;

  @IsOptional()
  @IsString()
  verse_text?: string;

  @IsOptional()
  @IsArray()
  items?: unknown[];

  @IsOptional()
  @IsString()
  touch_title?: string;

  @IsOptional()
  @IsString()
  touch_body?: string;

  @IsOptional()
  @IsString()
  location_title?: string;

  @IsOptional()
  @IsString()
  location_services_heading?: string;

  @IsOptional()
  @IsArray()
  location_services?: { name?: string; time?: string }[];

  @IsOptional()
  @IsString()
  office_phone?: string;

  @IsOptional()
  @IsString()
  map_title?: string;

  @IsOptional()
  @IsString()
  map_subtitle?: string;

  @IsOptional()
  @IsString()
  map_note?: string;

  @IsOptional()
  @IsString()
  map_url?: string;

  @IsOptional()
  @IsString()
  directions_url?: string;

  @IsOptional()
  @IsString()
  blurb?: string;
}

/**
 * Canonical landing CMS keys (must match frontend landing-defaults).
 * Unknown top-level keys are rejected.
 */
export class LandingPageContentDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LandingSectionDto)
  hero?: LandingSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LandingSectionDto)
  about?: LandingSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LandingSectionDto)
  vision?: LandingSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LandingSectionDto)
  ministries?: LandingSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LandingSectionDto)
  projects?: LandingSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LandingSectionDto)
  programs?: LandingSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LandingSectionDto)
  contact?: LandingSectionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LandingSectionDto)
  footer?: LandingSectionDto;
}

export const LANDING_CONTENT_KEYS = [
  "hero",
  "about",
  "vision",
  "ministries",
  "projects",
  "programs",
  "contact",
  "footer",
] as const;
