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
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const notifications_service_1 = require("./notifications.service");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let NotificationsController = class NotificationsController {
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    list(req) {
        return this.notificationsService.listForUser(req.user.id);
    }
    getPreferences(req) {
        return this.notificationsService.getPreferences(req.user.id);
    }
    updatePreferences(req, body) {
        return this.notificationsService.updatePreferences(req.user.id, body);
    }
    markAllRead(req) {
        return this.notificationsService.markAllRead(req.user.id);
    }
    markRead(req, id) {
        return this.notificationsService.markRead(req.user.id, id);
    }
    dismiss(req, id) {
        return this.notificationsService.dismiss(req.user.id, id);
    }
    stream(req) {
        return this.notificationsService.streamForUser(req.user.id);
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequiresPermissions)('notifications.read'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('preferences'),
    (0, permissions_decorator_1.RequiresPermissions)('notifications.update'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "getPreferences", null);
__decorate([
    (0, common_1.Patch)('preferences'),
    (0, permissions_decorator_1.RequiresPermissions)('notifications.update'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "updatePreferences", null);
__decorate([
    (0, common_1.Patch)('read-all'),
    (0, permissions_decorator_1.RequiresPermissions)('notifications.read'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "markAllRead", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    (0, permissions_decorator_1.RequiresPermissions)('notifications.read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "markRead", null);
__decorate([
    (0, common_1.Patch)(':id/dismiss'),
    (0, permissions_decorator_1.RequiresPermissions)('notifications.read'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "dismiss", null);
__decorate([
    (0, common_1.Sse)('stream'),
    (0, permissions_decorator_1.RequiresPermissions)('notifications.read'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", rxjs_1.Observable)
], NotificationsController.prototype, "stream", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
