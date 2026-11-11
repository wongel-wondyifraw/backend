import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from "class-validator";

import { NormalizeTitleInitials } from "../../../common/transformers/normalize-name.decorator";

export class CreateHomeGroupDto {
  @NormalizeTitleInitials()
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  about?: string;

  @IsString()
  @IsOptional()
  schedule?: string;

  @NormalizeTitleInitials()
  @IsString()
  @IsNotEmpty()
  location: string;

  @IsUUID()
  @IsOptional()
  leader_id?: string | null;

  @ValidateIf((o: CreateHomeGroupDto) => !!o.leader_id)
  @IsIn(["member", "minister"])
  @IsOptional()
  leader_type?: "member" | "minister" | null;
}
