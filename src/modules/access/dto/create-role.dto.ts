import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  Length,
  Matches,
} from "class-validator";
import { NormalizeTitleInitials } from "../../../common/transformers/normalize-name.decorator";

export class CreateRoleDto {
  @IsString()
  @Length(2, 64)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: "key must be lowercase letters, digits, and underscores",
  })
  key: string;

  @NormalizeTitleInitials()
  @IsString()
  @Length(1, 128)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 512)
  description?: string;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionSlugs: string[];
}
