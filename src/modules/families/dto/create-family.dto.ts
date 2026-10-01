import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

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
