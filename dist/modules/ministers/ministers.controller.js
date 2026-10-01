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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinistersController = void 0;
const common_1 = require("@nestjs/common");
const ministers_service_1 = require("./ministers.service");
const create_minister_dto_1 = require("./dto/create-minister.dto");
const update_minister_dto_1 = require("./dto/update-minister.dto");
const pagination_query_dto_1 = require("../../common/dto/pagination-query.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let MinistersController = class MinistersController {
    constructor(ministersService) {
        this.ministersService = ministersService;
    }
    create(dto) {
        return this.ministersService.create(dto);
    }
    findAll(query) {
        return this.ministersService.findAllPaginated(query.page, query.limit, query.search);
    }
    findOne(id) {
        return this.ministersService.findOne(id);
    }
    update(id, dto) {
        return this.ministersService.update(id, dto);
    }
    resetPassword(id) {
        return this.ministersService.resetPassword(id);
    }
    remove(id) {
        return this.ministersService.remove(id);
    }
};
exports.MinistersController = MinistersController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequiresPermissions)("ministers.create"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_minister_dto_1.CreateMinisterDto]),
    __metadata("design:returntype", void 0)
], MinistersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequiresPermissions)("ministers.read"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], MinistersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, permissions_decorator_1.RequiresPermissions)("ministers.read"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MinistersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, permissions_decorator_1.RequiresPermissions)("ministers.update"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_minister_dto_1.UpdateMinisterDto]),
    __metadata("design:returntype", void 0)
], MinistersController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(":id/reset-password"),
    (0, permissions_decorator_1.RequiresPermissions)("ministers.update"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MinistersController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, permissions_decorator_1.RequiresPermissions)("ministers.delete"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MinistersController.prototype, "remove", null);
exports.MinistersController = MinistersController = __decorate([
    (0, common_1.Controller)("ministers"),
    __metadata("design:paramtypes", [ministers_service_1.MinistersService])
], MinistersController);
