import { IsIn, IsOptional, IsString, IsUUID } from "class-validator";
import {
  NormalizePersonName,
  NormalizeTitleInitials,
} from "../../../common/transformers/normalize-name.decorator";

export class CreateFamilyDto {
  @IsOptional()
  @IsUUID()
  husband_id?: string;

  @IsOptional()
  @IsIn(["member", "minister"])
  husband_type?: "member" | "minister";

  @IsOptional()
  @IsUUID()
  wife_id?: string;

  @IsOptional()
  @IsIn(["member", "minister"])
  wife_type?: "member" | "minister";

  @IsOptional()
  @IsIn(["registered", "pending", "external", "none"])
  spouse_status?: string;

  @NormalizePersonName()
  @IsOptional()
  @IsString()
  external_spouse_name?: string;

  @IsOptional()
  @IsString()
  external_spouse_phone?: string;

  @NormalizeTitleInitials()
  @IsOptional()
  @IsString()
  external_spouse_church?: string;

  @NormalizeTitleInitials()
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
