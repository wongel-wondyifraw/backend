"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBibleStudyDto = void 0;
const class_validator_1 = require("class-validator");
const bible_books_1 = require("../../../common/constants/bible-books");
class CreateBibleStudyDto {
}
exports.CreateBibleStudyDto = CreateBibleStudyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateBibleStudyDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateBibleStudyDto.prototype, "about", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateBibleStudyDto.prototype, "schedule", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateBibleStudyDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsIn)(["book", "study_material"]),
    __metadata("design:type", String)
], CreateBibleStudyDto.prototype, "content_type", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.content_type === "book"),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: "Bible book is required when content type is Book" }),
    (0, class_validator_1.IsIn)([...bible_books_1.BIBLE_BOOKS], { message: "Invalid Bible book" }),
    __metadata("design:type", String)
], CreateBibleStudyDto.prototype, "bible_book", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.content_type === "study_material"),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateBibleStudyDto.prototype, "material_url", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateBibleStudyDto.prototype, "leader_id", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => !!o.leader_id),
    (0, class_validator_1.IsIn)(["member", "minister"]),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateBibleStudyDto.prototype, "leader_type", void 0);
