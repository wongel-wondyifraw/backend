"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadershipModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const member_entity_1 = require("../../modules/members/entities/member.entity");
const minister_entity_1 = require("../../modules/ministers/entities/minister.entity");
const leader_resolver_service_1 = require("./leader-resolver.service");
let LeadershipModule = class LeadershipModule {
};
exports.LeadershipModule = LeadershipModule;
exports.LeadershipModule = LeadershipModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([member_entity_1.Member, minister_entity_1.Minister])],
        providers: [leader_resolver_service_1.LeaderResolverService],
        exports: [leader_resolver_service_1.LeaderResolverService],
    })
], LeadershipModule);
