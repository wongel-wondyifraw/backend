import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { NormalizeTitleInitials } from "../../../common/transformers/normalize-name.decorator";

export class CreateTaskDefinitionDto {
  @NormalizeTitleInitials()
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  requires_visit_target?: boolean;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
