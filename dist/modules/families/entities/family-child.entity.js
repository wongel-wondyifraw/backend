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
exports.FamilyChild = void 0;
const typeorm_1 = require("typeorm");
const family_entity_1 = require("./family.entity");
let FamilyChild = class FamilyChild {
};
exports.FamilyChild = FamilyChild;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FamilyChild.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], FamilyChild.prototype, "family_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => family_entity_1.Family, (family) => family.children, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'family_id' }),
    __metadata("design:type", family_entity_1.Family)
], FamilyChild.prototype, "family", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FamilyChild.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], FamilyChild.prototype, "age", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], FamilyChild.prototype, "date_of_birth", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], FamilyChild.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], FamilyChild.prototype, "updated_at", void 0);
exports.FamilyChild = FamilyChild = __decorate([
    (0, typeorm_1.Entity)('family_children')
], FamilyChild);
