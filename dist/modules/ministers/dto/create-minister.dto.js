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
exports.CreateMinisterDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const normalize_name_decorator_1 = require("../../../common/transformers/normalize-name.decorator");
const flexible_date_validator_1 = require("../../../common/validators/flexible-date.validator");
class CreateMinisterDto {
}
exports.CreateMinisterDto = CreateMinisterDto;
__decorate([
    (0, normalize_name_decorator_1.NormalizePersonName)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMinisterDto.prototype, "first_name", void 0);
__decorate([
    (0, normalize_name_decorator_1.NormalizePersonName)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMinisterDto.prototype, "middle_name", void 0);
__decorate([
    (0, normalize_name_decorator_1.NormalizePersonName)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMinisterDto.prototype, "last_name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMinisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMinisterDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMinisterDto.prototype, "image_url", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMinisterDto.prototype, "address", void 0);
__decorate([
    (0, flexible_date_validator_1.IsFlexibleDate)({ allowPartial: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateMinisterDto.prototype, "date_of_birth", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => typeof value === "string" ? value.trim().toLowerCase() : value),
    (0, class_validator_1.IsIn)(["gc", "ec"]),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMinisterDto.prototype, "date_of_birth_calendar", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => typeof value === "string" ? value.trim().toLowerCase() : value),
    (0, class_validator_1.IsIn)(["day", "month", "year"]),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMinisterDto.prototype, "date_of_birth_precision", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMinisterDto.prototype, "marital_status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMinisterDto.prototype, "gender", void 0);
__decorate([
    (0, normalize_name_decorator_1.NormalizeTitleInitials)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMinisterDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMinisterDto.prototype, "status", void 0);
__decorate([
    (0, flexible_date_validator_1.IsFlexibleDate)({ allowPartial: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateMinisterDto.prototype, "joined_date", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => typeof value === "string" ? value.trim().toLowerCase() : value),
    (0, class_validator_1.IsIn)(["gc", "ec"]),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMinisterDto.prototype, "joined_date_calendar", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => typeof value === "string" ? value.trim().toLowerCase() : value),
    (0, class_validator_1.IsIn)(["day", "month", "year"]),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMinisterDto.prototype, "joined_date_precision", void 0);
