import { IsOptional, IsString, IsIn } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class UserListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  @IsIn(["active", "inactive", "locked", "deleted"])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(["admin", "minister_module", "self_registration", "invite"])
  origin?: string;
}
