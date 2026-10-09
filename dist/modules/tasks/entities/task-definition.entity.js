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
exports.TaskDefinition = void 0;
const typeorm_1 = require("typeorm");
const uuid_primary_1 = require("../../../common/entities/uuid-primary");
const task_entity_1 = require("./task.entity");
let TaskDefinition = class TaskDefinition extends uuid_primary_1.UuidPrimary {
};
exports.TaskDefinition = TaskDefinition;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TaskDefinition.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], TaskDefinition.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 64, nullable: true, unique: true }),
    __metadata("design:type", Object)
], TaskDefinition.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], TaskDefinition.prototype, "requires_visit_target", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], TaskDefinition.prototype, "is_system", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], TaskDefinition.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TaskDefinition.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TaskDefinition.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => task_entity_1.Task, (task) => task.definition),
    __metadata("design:type", Array)
], TaskDefinition.prototype, "tasks", void 0);
exports.TaskDefinition = TaskDefinition = __decorate([
    (0, typeorm_1.Entity)("task_definitions")
], TaskDefinition);
