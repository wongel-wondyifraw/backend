import {
  IsOptional,
  IsIn,
  IsUUID,
  IsString,
  MaxLength,
  IsDateString,
} from "class-validator";
import type { ContactRequestStatus } from "../entities/contact-request.entity";

export class UpdateContactRequestDto {
  @IsOptional()
  @IsIn(["new", "read", "in_progress", "responded", "archived"])
  status?: ContactRequestStatus;

  @IsOptional()
  @IsUUID()
  assigned_to?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  notes?: string | null;

  @IsOptional()
  @IsDateString()
  responded_at?: string | null;
}
