import { IsString, IsNotEmpty } from "class-validator";
import { IsStrongPassword } from "../../../common/validators/password-strength.validator";

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsStrongPassword()
  new_password: string;
}
