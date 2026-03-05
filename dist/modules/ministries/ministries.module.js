"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinistriesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ministries_service_1 = require("./ministries.service");
const ministries_controller_1 = require("./ministries.controller");
const ministry_entity_1 = require("./entities/ministry.entity");
const ministry_member_entity_1 = require("./entities/ministry-member.entity");
const member_entity_1 = require("../members/entities/member.entity");
let MinistriesModule = class MinistriesModule {
};
exports.MinistriesModule = MinistriesModule;
exports.MinistriesModule = MinistriesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([ministry_entity_1.Ministry, ministry_member_entity_1.MinistryMember, member_entity_1.Member])],
        controllers: [ministries_controller_1.MinistriesController],
        providers: [ministries_service_1.MinistriesService],
        exports: [ministries_service_1.MinistriesService],
    })
], MinistriesModule);
