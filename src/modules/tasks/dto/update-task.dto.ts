import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
} from "class-validator";

export class UpdateTaskDto {
  @IsUUID()
  @IsOptional()
  minister_id?: string;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;

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
