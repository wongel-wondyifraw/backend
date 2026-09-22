"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLocationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_location_dto_1 = require("./create-location.dto");
class UpdateLocationDto extends (0, swagger_1.PartialType)(create_location_dto_1.CreateLocationDto) {
}
exports.UpdateLocationDto = UpdateLocationDto;
