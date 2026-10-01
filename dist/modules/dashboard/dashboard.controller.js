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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const dashboard_service_1 = require("./dashboard.service");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let DashboardController = class DashboardController {
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    getStats() {
        return this.dashboardService.getStats();
    }
    search(query, req) {
        var _a, _b, _c;
        const perms = new Set(((_c = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.roleEntity) === null || _b === void 0 ? void 0 : _b.permissions) !== null && _c !== void 0 ? _c : []).map((p) => p.slug));
        const includeUsers = perms.has("users.read");
        return this.dashboardService.search(query || "", includeUsers);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)("stats"),
    (0, permissions_decorator_1.RequiresPermissions)("dashboard.read"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)("search"),
    (0, permissions_decorator_1.RequiresPermissions)("dashboard.read"),
    __param(0, (0, common_1.Query)("q")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "search", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)("dashboard"),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
