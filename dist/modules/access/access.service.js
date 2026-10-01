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
exports.AccessService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const role_entity_1 = require("./entities/role.entity");
const permission_entity_1 = require("./entities/permission.entity");
const user_entity_1 = require("../users/entities/user.entity");
const access_seeder_service_1 = require("./access.seeder.service");
const access_types_1 = require("./access.types");
let AccessService = class AccessService {
    constructor(roles, permissions, users, seeder) {
        this.roles = roles;
        this.permissions = permissions;
        this.users = users;
        this.seeder = seeder;
    }
    async listRoles() {
        return this.roles.find({
            relations: { permissions: true },
            order: { name: "ASC" },
        });
    }
    async findRole(id) {
        const role = await this.roles.findOne({
            where: { id },
            relations: { permissions: true },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role ${id} not found`);
        }
        return role;
    }
    async listPermissions() {
        return this.seeder.findAllPermissions();
    }
    async listPermissionsGrouped() {
        const all = await this.seeder.findAllPermissions();
        const grouped = {};
        for (const p of all) {
            if (!grouped[p.category])
                grouped[p.category] = [];
            grouped[p.category].push(p);
        }
        return grouped;
    }
    async findRoleByKey(key) {
        return this.seeder.findRoleByKey(key);
    }
    async createRole(dto) {
        var _a;
        const existing = await this.roles.findOne({ where: { key: dto.key } });
        if (existing) {
            throw new common_1.ConflictException(`Role key "${dto.key}" is already in use`);
        }
        const perms = await this.resolvePermissionSlugs(dto.permissionSlugs);
        const role = this.roles.create({
            key: dto.key,
            name: dto.name,
            description: (_a = dto.description) !== null && _a !== void 0 ? _a : null,
            is_system: false,
            permissions: perms,
        });
        return this.roles.save(role);
    }
    async updateRole(id, dto) {
        var _a;
        const role = await this.findRole(id);
        if (dto.name !== undefined)
            role.name = dto.name;
        if (dto.description !== undefined)
            role.description = (_a = dto.description) !== null && _a !== void 0 ? _a : null;
        if (dto.permissionSlugs !== undefined) {
            if (role.key === access_types_1.SYSTEM_ROLE_ADMIN_KEY) {
                role.permissions = await this.seeder.findAllPermissions();
            }
            else {
                role.permissions = await this.resolvePermissionSlugs(dto.permissionSlugs);
            }
        }
        return this.roles.save(role);
    }
    async removeRole(id) {
        const role = await this.findRole(id);
        if (role.is_system) {
            throw new common_1.BadRequestException("System roles cannot be deleted");
        }
        const userCount = await this.users.count({ where: { role_id: role.id } });
        if (userCount > 0) {
            throw new common_1.ConflictException(`Role is assigned to ${userCount} user(s) and cannot be deleted`);
        }
        await this.roles.remove(role);
    }
    async resolvePermissionSlugs(slugs) {
        if (slugs.length === 0)
            return [];
        const found = await this.permissions
            .createQueryBuilder("p")
            .where("p.slug IN (:...slugs)", { slugs })
            .getMany();
        if (found.length !== slugs.length) {
            const foundSet = new Set(found.map((p) => p.slug));
            const missing = slugs.filter((s) => !foundSet.has(s));
            throw new common_1.NotFoundException(`Unknown permission slug(s): ${missing.join(", ")}`);
        }
        return found;
    }
};
exports.AccessService = AccessService;
exports.AccessService = AccessService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(1, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        access_seeder_service_1.AccessSeederService])
], AccessService);
