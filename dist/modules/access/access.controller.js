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
exports.AccessController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const access_service_1 = require("./access.service");
const create_role_dto_1 = require("./dto/create-role.dto");
const update_role_dto_1 = require("./dto/update-role.dto");
let AccessController = class AccessController {
    constructor(accessService) {
        this.accessService = accessService;
    }
    listRoles() {
        return this.accessService.listRoles();
    }
    getRole(id) {
        return this.accessService.findRole(id);
    }
    createRole(dto) {
        return this.accessService.createRole(dto);
    }
    updateRole(id, dto) {
        return this.accessService.updateRole(id, dto);
    }
    async deleteRole(id) {
        await this.accessService.removeRole(id);
    }
    listPermissions() {
        return this.accessService.listPermissions();
    }
    listPermissionsGrouped() {
        return this.accessService.listPermissionsGrouped();
    }
};
exports.AccessController = AccessController;
__decorate([
    (0, common_1.Get)('roles'),
    (0, permissions_decorator_1.RequiresPermissions)('roles.read', 'users.manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AccessController.prototype, "listRoles", null);
__decorate([
    (0, common_1.Get)('roles/:id'),
    (0, permissions_decorator_1.RequiresPermissions)('roles.read'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccessController.prototype, "getRole", null);
__decorate([
    (0, common_1.Post)('roles'),
    (0, permissions_decorator_1.RequiresPermissions)('roles.manage'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_role_dto_1.CreateRoleDto]),
    __metadata("design:returntype", void 0)
], AccessController.prototype, "createRole", null);
__decorate([
    (0, common_1.Patch)('roles/:id'),
    (0, permissions_decorator_1.RequiresPermissions)('roles.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_role_dto_1.UpdateRoleDto]),
    __metadata("design:returntype", void 0)
], AccessController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)('roles/:id'),
    (0, permissions_decorator_1.RequiresPermissions)('roles.manage'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccessController.prototype, "deleteRole", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, permissions_decorator_1.RequiresPermissions)('roles.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AccessController.prototype, "listPermissions", null);
__decorate([
    (0, common_1.Get)('permissions/grouped'),
    (0, permissions_decorator_1.RequiresPermissions)('roles.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AccessController.prototype, "listPermissionsGrouped", null);
exports.AccessController = AccessController = __decorate([
    (0, common_1.Controller)('access'),
    __metadata("design:paramtypes", [access_service_1.AccessService])
], AccessController);
