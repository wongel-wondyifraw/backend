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
exports.FamiliesController = void 0;
const common_1 = require("@nestjs/common");
const families_service_1 = require("./families.service");
const create_family_dto_1 = require("./dto/create-family.dto");
const update_family_dto_1 = require("./dto/update-family.dto");
const create_family_child_dto_1 = require("./dto/create-family-child.dto");
const update_family_child_dto_1 = require("./dto/update-family-child.dto");
const pagination_query_dto_1 = require("../../common/dto/pagination-query.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let FamiliesController = class FamiliesController {
    constructor(familiesService) {
        this.familiesService = familiesService;
    }
    getStats() {
        return this.familiesService.getStats();
    }
    async findByMember(memberId) {
        const family = await this.familiesService.findByPerson(memberId, "member");
        return { family };
    }
    async findByPerson(personId, type) {
        const personType = type === "minister" ? "minister" : "member";
        const family = await this.familiesService.findByPerson(personId, personType);
        return { family };
    }
    create(dto) {
        return this.familiesService.create(dto);
    }
    findAll(query) {
        return this.familiesService.findAllPaginated(query.page, query.limit, query.search);
    }
    findOne(id) {
        return this.familiesService.findOne(id);
    }
    update(id, dto) {
        return this.familiesService.update(id, dto);
    }
    remove(id) {
        return this.familiesService.remove(id);
    }
    addChild(id, dto) {
        return this.familiesService.addChild(id, dto);
    }
    updateChild(id, childId, dto) {
        return this.familiesService.updateChild(id, childId, dto);
    }
    removeChild(id, childId) {
        return this.familiesService.removeChild(id, childId);
    }
};
exports.FamiliesController = FamiliesController;
__decorate([
    (0, common_1.Get)("stats"),
    (0, permissions_decorator_1.RequiresPermissions)("families.read"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)("by-member/:memberId"),
    (0, permissions_decorator_1.RequiresPermissions)("families.read"),
    __param(0, (0, common_1.Param)("memberId", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FamiliesController.prototype, "findByMember", null);
__decorate([
    (0, common_1.Get)("by-person/:personId"),
    (0, permissions_decorator_1.RequiresPermissions)("families.read"),
    __param(0, (0, common_1.Param)("personId", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)("type")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FamiliesController.prototype, "findByPerson", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequiresPermissions)("families.create"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_family_dto_1.CreateFamilyDto]),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequiresPermissions)("families.read"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, permissions_decorator_1.RequiresPermissions)("families.read"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, permissions_decorator_1.RequiresPermissions)("families.update"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_family_dto_1.UpdateFamilyDto]),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, permissions_decorator_1.RequiresPermissions)("families.delete"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(":id/children"),
    (0, permissions_decorator_1.RequiresPermissions)("families.update"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_family_child_dto_1.CreateFamilyChildDto]),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "addChild", null);
__decorate([
    (0, common_1.Patch)(":id/children/:childId"),
    (0, permissions_decorator_1.RequiresPermissions)("families.update"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)("childId", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_family_child_dto_1.UpdateFamilyChildDto]),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "updateChild", null);
__decorate([
    (0, common_1.Delete)(":id/children/:childId"),
    (0, permissions_decorator_1.RequiresPermissions)("families.update"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)("childId", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FamiliesController.prototype, "removeChild", null);
exports.FamiliesController = FamiliesController = __decorate([
    (0, common_1.Controller)("families"),
    __metadata("design:paramtypes", [families_service_1.FamiliesService])
], FamiliesController);
