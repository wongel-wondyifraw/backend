import {
  Allow,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";
import { IsStrongPassword } from "../../../common/validators/password-strength.validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsOptional()
  middle_name?: string;

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

  @ValidateIf((o) => o.role === "minister" || o.role === "staff")
  @IsString()
  @IsNotEmpty({ message: "Title is mandatory for Ministers and Staff" })
  title?: string;

  @IsOptional()
  is_active?: string | boolean;

  @Allow()
  avatar?: Express.Multer.File | string | null;
}
