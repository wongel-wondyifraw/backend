import { Type } from "class-transformer";
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class UpdateFamilyChildDto {
  @IsString()
  @IsOptional()
  name?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  @IsOptional()
  age?: number;

  @IsOptional()
  @IsDateString()
  date_of_birth?: string;
}
