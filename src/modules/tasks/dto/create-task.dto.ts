import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from "class-validator";

export class CreateTaskDto {
  @IsUUID()
  definition_id: string;

  @IsUUID()
  minister_id: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

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
