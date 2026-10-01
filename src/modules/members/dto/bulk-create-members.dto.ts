import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from "class-validator";
import { CreateMemberDto } from "./create-member.dto";

export class BulkCreateMembersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreateMemberDto)
  items: CreateMemberDto[];
}
