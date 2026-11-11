import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from "class-validator";

import { NormalizeTitleInitials } from "../../../common/transformers/normalize-name.decorator";

export class CreateMinistryDto {
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

  @IsUUID()
  @IsOptional()
  leader_id?: string | null;

  @ValidateIf((o: CreateMinistryDto) => !!o.leader_id)
  @IsIn(["member", "minister"])
  @IsOptional()
  leader_type?: "member" | "minister" | null;
}
