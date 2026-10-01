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
exports.Ministry = void 0;
const typeorm_1 = require("typeorm");
const ministry_member_entity_1 = require("./ministry-member.entity");
let Ministry = class Ministry {
};
exports.Ministry = Ministry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Ministry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Ministry.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Ministry.prototype, "about", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Ministry.prototype, "schedule", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], Ministry.prototype, "leader_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 16, nullable: true }),
    __metadata("design:type", Object)
], Ministry.prototype, "leader_type", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Ministry.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Ministry.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ministry_member_entity_1.MinistryMember, (ministryMember) => ministryMember.ministry),
    __metadata("design:type", Array)
], Ministry.prototype, "ministry_members", void 0);
exports.Ministry = Ministry = __decorate([
    (0, typeorm_1.Entity)("ministries"),
    (0, typeorm_1.Index)("IDX_ministries_leader_id", ["leader_id"])
], Ministry);
