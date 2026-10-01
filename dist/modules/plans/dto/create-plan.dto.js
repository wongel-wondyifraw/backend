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
exports.CreatePlanDto = exports.PLAN_STATUSES = exports.PLAN_TYPES = void 0;
const class_validator_1 = require("class-validator");
exports.PLAN_TYPES = [
    "program",
    "crusade",
    "general_assembly",
    "training",
    "fasting_day",
    "gospel_campaign",
];
exports.PLAN_STATUSES = ["planned", "completed", "cancelled"];
/** HH:mm or HH:mm:ss */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
class CreatePlanDto {
}
exports.CreatePlanDto = CreatePlanDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePlanDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsIn)(exports.PLAN_TYPES),
    __metadata("design:type", Object)
], CreatePlanDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreatePlanDto.prototype, "plan_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(TIME_PATTERN, { message: "start_time must be HH:mm or HH:mm:ss" }),
    __metadata("design:type", Object)
], CreatePlanDto.prototype, "start_time", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(TIME_PATTERN, { message: "end_time must be HH:mm or HH:mm:ss" }),
    __metadata("design:type", Object)
], CreatePlanDto.prototype, "end_time", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], CreatePlanDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], CreatePlanDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(exports.PLAN_STATUSES),
    __metadata("design:type", Object)
], CreatePlanDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsUUID)("4", { each: true }),
    __metadata("design:type", Array)
], CreatePlanDto.prototype, "minister_ids", void 0);
