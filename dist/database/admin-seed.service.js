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
var AdminSeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSeedService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const users_service_1 = require("../modules/users/users.service");
let AdminSeedService = AdminSeedService_1 = class AdminSeedService {
    constructor(config, usersService) {
        this.config = config;
        this.usersService = usersService;
        this.logger = new common_1.Logger(AdminSeedService_1.name);
    }
    async onModuleInit() {
        var _a;
        const email = (_a = this.config.get('ADMIN_EMAIL')) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
        const password = this.config.get('ADMIN_PASSWORD');
        if (!email || !password) {
            this.logger.debug('Admin seed skipped: ADMIN_EMAIL or ADMIN_PASSWORD not set');
            return;
        }
        const existing = await this.usersService.findOneByEmail(email);
        if (existing) {
            await this.usersService.setPasswordFromPlain(existing.id, password);
            this.logger.log(`Admin password synced from env: ${email}`);
            return;
        }
        await this.usersService.create({
            first_name: this.config.get('ADMIN_FIRST_NAME', 'System'),
            middle_name: this.config.get('ADMIN_MIDDLE_NAME', ''),
            last_name: this.config.get('ADMIN_LAST_NAME', 'Admin'),
            email,
            password,
            role: 'admin',
            is_active: true,
        });
        this.logger.log(`Admin user seeded: ${email}`);
    }
};
exports.AdminSeedService = AdminSeedService;
exports.AdminSeedService = AdminSeedService = AdminSeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        users_service_1.UsersService])
], AdminSeedService);
