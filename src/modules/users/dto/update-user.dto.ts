import { PartialType } from "@nestjs/swagger";
import { CreateUserDto } from "./create-user.dto";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { NormalizePersonName } from "../../../common/transformers/normalize-name.decorator";

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsOptional()
  role?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  password_hash?: string; // used internally by admin update

  @NormalizePersonName()
  @IsString()
  @IsOptional()
  middle_name?: string;

  // Redefining these from frontend names
  @NormalizePersonName()
  @IsString()
  @IsOptional()
  first_name?: string;

  @NormalizePersonName()
  @IsString()
  @IsOptional()
  last_name?: string;
}
