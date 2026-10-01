import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  Length,
} from "class-validator";

export class UpdateRoleDto {
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
