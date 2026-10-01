import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsIn,
  IsBoolean,
  MaxLength,
} from "class-validator";
import type { ContactRequestCategory } from "../entities/contact-request.entity";

export class CreateContactRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  full_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phone: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsIn(["prayer", "cell", "baptism", "counseling", "chms", "general"])
  category?: ContactRequestCategory;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  message: string;

  @IsOptional()
  @IsBoolean()
  is_confidential?: boolean;
}
