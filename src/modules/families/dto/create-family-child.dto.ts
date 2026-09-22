import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min, IsOptional } from 'class-validator';

export class CreateFamilyChildDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString() // Can also use @IsDateString() if preferred
  date_of_birth?: string;
}
