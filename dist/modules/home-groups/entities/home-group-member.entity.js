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
exports.HomeGroupMember = void 0;
const typeorm_1 = require("typeorm");
const home_group_entity_1 = require("./home-group.entity");
const member_entity_1 = require("../../members/entities/member.entity");
let HomeGroupMember = class HomeGroupMember {
};
exports.HomeGroupMember = HomeGroupMember;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], HomeGroupMember.prototype, "home_group_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], HomeGroupMember.prototype, "member_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], HomeGroupMember.prototype, "joined_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => home_group_entity_1.HomeGroup, (homeGroup) => homeGroup.home_group_members, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'home_group_id' }),
    __metadata("design:type", home_group_entity_1.HomeGroup)
], HomeGroupMember.prototype, "home_group", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_entity_1.Member, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'member_id' }),
    __metadata("design:type", member_entity_1.Member)
], HomeGroupMember.prototype, "member", void 0);
exports.HomeGroupMember = HomeGroupMember = __decorate([
    (0, typeorm_1.Entity)('home_group_members')
], HomeGroupMember);
