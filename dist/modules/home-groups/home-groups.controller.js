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
exports.HomeGroupsController = void 0;
const common_1 = require("@nestjs/common");
const home_groups_service_1 = require("./home-groups.service");
const create_home_group_dto_1 = require("./dto/create-home-group.dto");
const update_home_group_dto_1 = require("./dto/update-home-group.dto");
const pagination_query_dto_1 = require("../../common/dto/pagination-query.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let HomeGroupsController = class HomeGroupsController {
    constructor(homeGroupsService) {
        this.homeGroupsService = homeGroupsService;
    }
    create(dto) {
        return this.homeGroupsService.create(dto);
    }
    findAll(query) {
        return this.homeGroupsService.findAllPaginated(query.page, query.limit, query.search);
    }
    findOne(id) {
        return this.homeGroupsService.findOne(id);
    }
    update(id, dto) {
        return this.homeGroupsService.update(id, dto);
    }
    remove(id) {
        return this.homeGroupsService.remove(id);
    }
    getMembers(id) {
        return this.homeGroupsService.getHomeGroupMembers(id);
    }
    addMember(id, memberId) {
        return this.homeGroupsService.addMember(id, memberId);
    }
    removeMember(id, memberId) {
        return this.homeGroupsService.removeMember(id, memberId);
    }
};
exports.HomeGroupsController = HomeGroupsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequiresPermissions)("home_groups.create"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_home_group_dto_1.CreateHomeGroupDto]),
    __metadata("design:returntype", void 0)
], HomeGroupsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequiresPermissions)("home_groups.read"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], HomeGroupsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, permissions_decorator_1.RequiresPermissions)("home_groups.read"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HomeGroupsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, permissions_decorator_1.RequiresPermissions)("home_groups.update"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_home_group_dto_1.UpdateHomeGroupDto]),
    __metadata("design:returntype", void 0)
], HomeGroupsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, permissions_decorator_1.RequiresPermissions)("home_groups.delete"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HomeGroupsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(":id/members"),
    (0, permissions_decorator_1.RequiresPermissions)("home_groups.read"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HomeGroupsController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Post)(":id/members/:memberId"),
    (0, permissions_decorator_1.RequiresPermissions)("home_groups.update"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)("memberId", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], HomeGroupsController.prototype, "addMember", null);
__decorate([
    (0, common_1.Delete)(":id/members/:memberId"),
    (0, permissions_decorator_1.RequiresPermissions)("home_groups.update"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)("memberId", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], HomeGroupsController.prototype, "removeMember", null);
exports.HomeGroupsController = HomeGroupsController = __decorate([
    (0, common_1.Controller)("home-groups"),
    __metadata("design:paramtypes", [home_groups_service_1.HomeGroupsService])
], HomeGroupsController);
