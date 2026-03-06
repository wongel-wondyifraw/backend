"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinistersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ministers_service_1 = require("./ministers.service");
const ministers_controller_1 = require("./ministers.controller");
const minister_entity_1 = require("./entities/minister.entity");
const member_entity_1 = require("../members/entities/member.entity");
const user_entity_1 = require("../users/entities/user.entity");
let MinistersModule = class MinistersModule {
};
exports.MinistersModule = MinistersModule;
exports.MinistersModule = MinistersModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([minister_entity_1.Minister, member_entity_1.Member, user_entity_1.User])],
        controllers: [ministers_controller_1.MinistersController],
        providers: [ministers_service_1.MinistersService],
        exports: [ministers_service_1.MinistersService],
    })
], MinistersModule);
