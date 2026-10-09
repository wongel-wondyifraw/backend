import { IsString, IsNotEmpty } from "class-validator";
import { IsStrongPassword } from "../../../common/validators/password-strength.validator";

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  newPassword: string;
}
