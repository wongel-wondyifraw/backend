import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { IsStrongPassword } from "../../../common/validators/password-strength.validator";
import { NormalizePersonName } from "../../../common/transformers/normalize-name.decorator";

export class RegisterDto {
  @NormalizePersonName()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsStrongPassword()
  password: string;
}
