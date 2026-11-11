import { IsString, IsOptional } from "class-validator";
import { NormalizePersonName } from "../../../common/transformers/normalize-name.decorator";

export class UpdateProfileDto {
  @NormalizePersonName()
  @IsString()
  @IsOptional()
  first_name?: string;

  @NormalizePersonName()
  @IsString()
  @IsOptional()
  middle_name?: string;

  @NormalizePersonName()
  @IsString()
  @IsOptional()
  last_name?: string;
}
