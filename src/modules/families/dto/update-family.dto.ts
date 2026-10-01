import { IsIn, IsOptional, IsString, IsUUID } from "class-validator";

export class UpdateFamilyDto {
  @IsUUID()
  @IsOptional()
  husband_id?: string;

  @IsIn(["member", "minister"])
  @IsOptional()
  husband_type?: "member" | "minister";

  @IsUUID()
  @IsOptional()
  wife_id?: string;

  @IsIn(["member", "minister"])
  @IsOptional()
  wife_type?: "member" | "minister";

  @IsOptional()
  @IsIn(["registered", "pending", "external", "none"])
  spouse_status?: string;

  @IsOptional()
  @IsString()
  external_spouse_name?: string;

  @IsOptional()
  @IsString()
  external_spouse_phone?: string;

  @IsOptional()
  @IsString()
  external_spouse_church?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
