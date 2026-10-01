import { IsString, IsOptional } from "class-validator";

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  middle_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;
}
