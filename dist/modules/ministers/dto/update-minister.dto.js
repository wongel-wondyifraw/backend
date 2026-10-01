"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMinisterDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_minister_dto_1 = require("./create-minister.dto");
class UpdateMinisterDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(create_minister_dto_1.CreateMinisterDto, ["email"])) {
}
exports.UpdateMinisterDto = UpdateMinisterDto;
