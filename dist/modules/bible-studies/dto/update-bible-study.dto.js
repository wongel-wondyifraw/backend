"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBibleStudyDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_bible_study_dto_1 = require("./create-bible-study.dto");
class UpdateBibleStudyDto extends (0, mapped_types_1.PartialType)(create_bible_study_dto_1.CreateBibleStudyDto) {
}
exports.UpdateBibleStudyDto = UpdateBibleStudyDto;
