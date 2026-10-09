import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { IsStrongPassword } from "../../../common/validators/password-strength.validator";

export class RegisterDto {
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
