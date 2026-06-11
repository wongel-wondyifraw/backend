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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AccessSeederService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessSeederService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const permissionCatalog_json_1 = __importDefault(require("./permissionCatalog.json"));
const systemRoles_json_1 = __importDefault(require("./systemRoles.json"));
const permission_entity_1 = require("./entities/permission.entity");
const role_entity_1 = require("./entities/role.entity");
const user_entity_1 = require("../users/entities/user.entity");
const access_types_1 = require("./access.types");
const catalog = permissionCatalog_json_1.default;
const systemRoleDefs = systemRoles_json_1.default;
let AccessSeederService = AccessSeederService_1 = class AccessSeederService {
    constructor(permissions, roles, users, config) {
        this.permissions = permissions;
        this.roles = roles;
        this.users = users;
        this.config = config;
        this.logger = new common_1.Logger(AccessSeederService_1.name);
        this.seeded = false;
    }
    async onModuleInit() {
        await this.ensureSeeded();
        await this.backfillUserRoleIds();
    }
    async ensureSeeded() {
        if (this.seeded) {
            const admin = await this.roles.findOne({
                where: { key: access_types_1.SYSTEM_ROLE_ADMIN_KEY },
                relations: { permissions: true },
            });
            if (admin)
                return admin;
        }
        const allPermissions = await this.upsertPermissions();
        await this.upsertSystemRoles(allPermissions);
        const adminRole = await this.roles.findOneOrFail({
            where: { key: access_types_1.SYSTEM_ROLE_ADMIN_KEY },
            relations: { permissions: true },
        });
        this.seeded = true;
        return adminRole;
    }
    async upsertPermissions() {
        var _a, _b;
        const results = [];
        for (const entry of catalog) {
            let row = await this.permissions.findOne({ where: { slug: entry.slug } });
            if (!row) {
                row = this.permissions.create({
                    slug: entry.slug,
                    name: entry.name,
                    category: entry.category,
                    description: (_a = entry.description) !== null && _a !== void 0 ? _a : null,
                });
            }
            else {
                row.name = entry.name;
                row.category = entry.category;
                row.description = (_b = entry.description) !== null && _b !== void 0 ? _b : null;
            }
            results.push(await this.permissions.save(row));
        }
        this.logger.log(`Seeded ${results.length} permissions from catalog`);
        return results;
    }
    async upsertSystemRoles(allPermissions) {
        var _a, _b, _c, _d;
        const reseed = this.config.get('RBAC_RESEED_SYSTEM') === 'true';
        const slugToPermission = new Map(allPermissions.map((p) => [p.slug, p]));
        const allSlugs = allPermissions.map((p) => p.slug);
        for (const def of systemRoleDefs) {
            let role = await this.roles.findOne({
                where: { key: def.key },
                relations: { permissions: true },
            });
            const isNew = !role;
            if (!role) {
                role = this.roles.create({
                    key: def.key,
                    name: def.name,
                    description: (_a = def.description) !== null && _a !== void 0 ? _a : null,
                    is_system: true,
                    permissions: [],
                });
                role = await this.roles.save(role);
            }
            else if (role.name !== def.name || role.description !== ((_b = def.description) !== null && _b !== void 0 ? _b : null)) {
                role.name = def.name;
                role.description = (_c = def.description) !== null && _c !== void 0 ? _c : null;
                await this.roles.save(role);
            }
            const desiredSlugs = def.permissionSlugs === '*'
                ? allSlugs
                : def.permissionSlugs.filter((s) => slugToPermission.has(s));
            const currentSlugs = new Set(((_d = role.permissions) !== null && _d !== void 0 ? _d : []).map((p) => p.slug));
            const isWildcard = def.permissionSlugs === '*';
            const wildcardMissingPerms = isWildcard && desiredSlugs.some((s) => !currentSlugs.has(s));
            const hasNoPermissions = currentSlugs.size === 0;
            const shouldSyncPerms = isNew || reseed || hasNoPermissions || wildcardMissingPerms;
            if (shouldSyncPerms) {
                const perms = desiredSlugs.map((s) => slugToPermission.get(s));
                role.permissions = perms;
                await this.roles.save(role);
                this.logger.log(`Synced ${perms.length} permission(s) onto system role ${def.key}`);
            }
        }
        this.logger.log(`Seeded ${systemRoleDefs.length} system roles`);
    }
    async findRoleByKey(key) {
        return this.roles.findOne({
            where: { key },
            relations: { permissions: true },
        });
    }
    async findAllPermissions() {
        return this.permissions.find({ order: { category: 'ASC', slug: 'ASC' } });
    }
    async backfillUserRoleIds() {
        var _a;
        const users = await this.users.find();
        for (const user of users) {
            if (user.role_id)
                continue;
            const key = (_a = user.role) !== null && _a !== void 0 ? _a : 'staff';
            const role = await this.findRoleByKey(key);
            if (!role)
                continue;
            await this.users.update(user.id, { role_id: role.id, role: role.key });
        }
    }
};
exports.AccessSeederService = AccessSeederService;
exports.AccessSeederService = AccessSeederService = AccessSeederService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], AccessSeederService);
