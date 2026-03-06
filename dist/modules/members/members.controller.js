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
exports.MembersController = void 0;
const common_1 = require("@nestjs/common");
const members_service_1 = require("./members.service");
const create_member_dto_1 = require("./dto/create-member.dto");
const update_member_dto_1 = require("./dto/update-member.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const ministries_service_1 = require("../ministries/ministries.service");
const file_fields_interceptor_1 = require("@nestjs/platform-express/multer/interceptors/file-fields.interceptor");
let MembersController = class MembersController {
    constructor(membersService, ministriesService) {
        this.membersService = membersService;
        this.ministriesService = ministriesService;
    }
    // members.controller.ts
    async create(createMemberDto, files) {
        var _a, _b;
        return this.membersService.create(createMemberDto, (_a = files.avatar) === null || _a === void 0 ? void 0 : _a[0], (_b = files.document) === null || _b === void 0 ? void 0 : _b[0]);
    }
    async findAll() {
        return this.membersService.findAll();
    }
    async findOne(id) {
        return this.membersService.findOne(id);
    }
    async update(id, updateMemberDto) {
        return this.membersService.update(id, updateMemberDto);
    }
    async remove(id) {
        return this.membersService.remove(id);
    }
    async getMemberMinistries(id) {
        return this.ministriesService.getMemberMinistries(id);
    }
};
exports.MembersController = MembersController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, file_fields_interceptor_1.FileFieldsInterceptor)([
        { name: 'avatar', maxCount: 1 },
        { name: 'document', maxCount: 1 },
    ])),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_member_dto_1.CreateMemberDto, Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_member_dto_1.UpdateMemberDto]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/ministries'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "getMemberMinistries", null);
exports.MembersController = MembersController = __decorate([
    (0, common_1.Controller)('members'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [members_service_1.MembersService,
        ministries_service_1.MinistriesService])
], MembersController);
