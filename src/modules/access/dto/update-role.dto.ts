import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import { NormalizeTitleInitials } from "../../../common/transformers/normalize-name.decorator";

export class UpdateRoleDto {
  @NormalizeTitleInitials()
  @IsOptional()
  @IsString()
  @Length(1, 128)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 512)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionSlugs?: string[];
}
