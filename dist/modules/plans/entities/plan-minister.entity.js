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
exports.PlanMinister = void 0;
const typeorm_1 = require("typeorm");
const plan_entity_1 = require("./plan.entity");
const minister_entity_1 = require("../../ministers/entities/minister.entity");
let PlanMinister = class PlanMinister {
};
exports.PlanMinister = PlanMinister;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], PlanMinister.prototype, "plan_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], PlanMinister.prototype, "minister_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PlanMinister.prototype, "assigned_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => plan_entity_1.Plan, (plan) => plan.plan_ministers, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'plan_id' }),
    __metadata("design:type", plan_entity_1.Plan)
], PlanMinister.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => minister_entity_1.Minister, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'minister_id' }),
    __metadata("design:type", minister_entity_1.Minister)
], PlanMinister.prototype, "minister", void 0);
exports.PlanMinister = PlanMinister = __decorate([
    (0, typeorm_1.Entity)('plan_ministers')
], PlanMinister);
