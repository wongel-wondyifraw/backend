"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateHomeGroupDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_home_group_dto_1 = require("./create-home-group.dto");
class UpdateHomeGroupDto extends (0, mapped_types_1.PartialType)(create_home_group_dto_1.CreateHomeGroupDto) {
}
exports.UpdateHomeGroupDto = UpdateHomeGroupDto;
