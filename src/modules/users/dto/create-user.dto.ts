import {
  Allow,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";
import { IsStrongPassword } from "../../../common/validators/password-strength.validator";
import {
  NormalizePersonName,
  NormalizeTitleInitials,
} from "../../../common/transformers/normalize-name.decorator";

export class CreateUserDto {
  @NormalizePersonName()
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @NormalizePersonName()
  @IsString()
  @IsOptional()
  middle_name?: string;

  @NormalizePersonName()
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password_hash: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @NormalizeTitleInitials()
  @ValidateIf((o) => o.role === "minister" || o.role === "staff")
  @IsString()
  @IsNotEmpty({ message: "Title is mandatory for Ministers and Staff" })
  title?: string;

  @IsOptional()
  is_active?: string | boolean;

  @Allow()
  avatar?: Express.Multer.File | string | null;
}
