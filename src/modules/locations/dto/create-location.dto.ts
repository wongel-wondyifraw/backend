import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
} from "class-validator";
import { NormalizeTitleInitials } from "../../../common/transformers/normalize-name.decorator";

export class CreateLocationDto {
  @NormalizeTitleInitials()
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEnum(["active", "inactive"])
  status?: string;

  @IsOptional()
  @IsUUID()
  parent_id?: string;
}
