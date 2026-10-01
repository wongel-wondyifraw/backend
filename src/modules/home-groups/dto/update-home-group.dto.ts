import { PartialType } from "@nestjs/mapped-types";
import { CreateHomeGroupDto } from "./create-home-group.dto";

export class UpdateHomeGroupDto extends PartialType(CreateHomeGroupDto) {}
