import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from "class-validator";
import { CreatePlanDto } from "./create-plan.dto";

export class BulkCreatePlansDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreatePlanDto)
  items: CreatePlanDto[];
}
