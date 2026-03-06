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
exports.MinistriesController = void 0;
const common_1 = require("@nestjs/common");
const ministries_service_1 = require("./ministries.service");
const create_ministry_dto_1 = require("./dto/create-ministry.dto");
const update_ministry_dto_1 = require("./dto/update-ministry.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let MinistriesController = class MinistriesController {
    constructor(ministriesService) {
        this.ministriesService = ministriesService;
    }
    async create(createMinistryDto) {
        return this.ministriesService.create(createMinistryDto);
    }
    async findAll() {
        return this.ministriesService.findAll();
    }
    async findOne(id) {
        return this.ministriesService.findOne(id);
    }
    async update(id, updateMinistryDto) {
        return this.ministriesService.update(id, updateMinistryDto);
    }
    async remove(id) {
        return this.ministriesService.remove(id);
    }
    // ==================== Ministry Members ====================
    async getMinistryMembers(id) {
        return this.ministriesService.getMinistryMembers(id);
    }
    async addMember(id, memberId) {
        return this.ministriesService.addMember(id, memberId);
    }
    async removeMember(id, memberId) {
        return this.ministriesService.removeMember(id, memberId);
    }
};
exports.MinistriesController = MinistriesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_ministry_dto_1.CreateMinistryDto]),
    __metadata("design:returntype", Promise)
], MinistriesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MinistriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MinistriesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_ministry_dto_1.UpdateMinistryDto]),
    __metadata("design:returntype", Promise)
], MinistriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MinistriesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MinistriesController.prototype, "getMinistryMembers", null);
__decorate([
    (0, common_1.Post)(':id/members/:memberId'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('memberId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MinistriesController.prototype, "addMember", null);
__decorate([
    (0, common_1.Delete)(':id/members/:memberId'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('memberId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MinistriesController.prototype, "removeMember", null);
exports.MinistriesController = MinistriesController = __decorate([
    (0, common_1.Controller)('ministries'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ministries_service_1.MinistriesService])
], MinistriesController);
