"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const user_entity_1 = require("./entities/user.entity");
const password_reset_token_entity_1 = require("../auth/entities/password-reset-token.entity");
const access_seeder_service_1 = require("../access/access.seeder.service");
const user_mapper_1 = require("./user.mapper");
const notification_events_1 = require("../notifications/notification-events");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const crypto_1 = require("crypto");
let UsersService = class UsersService {
    constructor(usersRepository, accessSeeder, events, auditLogsService, passwordResetTokenRepository) {
        this.usersRepository = usersRepository;
        this.accessSeeder = accessSeeder;
        this.events = events;
        this.auditLogsService = auditLogsService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.userRelations = { roleEntity: { permissions: true } };
    }
    async create(createUserDto, actingUser) {
        var _a, _b;
        const { password_hash, avatar: _avatar, avatar_url, password, role, ...rest } = createUserDto;
        const roleEntity = await this.accessSeeder.findRoleByKey(role !== null && role !== void 0 ? role : "staff");
        if (!roleEntity) {
            throw new common_1.NotFoundException(`Role "${role}" not found`);
        }
        if (roleEntity.key === "admin" &&
            actingUser &&
            actingUser.role !== "admin") {
            throw new common_1.ForbiddenException("Only administrators can create admin users");
        }
        const userData = {
            ...rest,
            email: (_a = rest.email) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase(),
            avatar_url: avatar_url !== null && avatar_url !== void 0 ? avatar_url : undefined,
            role: roleEntity.key,
            role_id: roleEntity.id,
            roleEntity,
            is_active: rest.is_active === "true" || rest.is_active === true,
            created_at: createUserDto.created_at || new Date(),
        };
        const plainPassword = (_b = password_hash !== null && password_hash !== void 0 ? password_hash : password) !== null && _b !== void 0 ? _b : (0, crypto_1.randomBytes)(16).toString("hex");
        if (plainPassword) {
            userData.password_hash = await this.hashPassword(plainPassword);
        }
        const user = this.usersRepository.create(userData);
        const saved = await this.usersRepository.save(user);
        await this.auditLogsService.logAction("user.created", "user", saved.id, (actingUser === null || actingUser === void 0 ? void 0 : actingUser.id) || null, { email: saved.email, role: saved.role, created_via: saved.created_via });
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: "user.created",
            kind: "user",
            severity: "info",
            title: "New user account",
            message: `${saved.email} was added as ${roleEntity.key}.`,
            href: "/settings",
            dedupeKey: `user.created:${saved.id}`,
            targetRoles: ["admin"],
        });
        return (0, user_mapper_1.toUserResponse)(saved, true);
    }
    async setPasswordFromPlain(userId, plainPassword) {
        await this.usersRepository.update(userId, {
            password_hash: await this.hashPassword(plainPassword),
        });
    }
    async hashPassword(value) {
        if (/^\$2[aby]?\$/.test(value)) {
            return value;
        }
        const salt = await bcrypt.genSalt();
        return bcrypt.hash(value, salt);
    }
    async findAllPaginated(page = 1, limit = 20, search, filters) {
        const qb = this.usersRepository
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.roleEntity", "roleEntity")
            .leftJoinAndSelect("roleEntity.permissions", "permissions");
        if ((filters === null || filters === void 0 ? void 0 : filters.status) === "deleted") {
            qb.withDeleted().andWhere("user.deleted_at IS NOT NULL");
        }
        else {
            if ((filters === null || filters === void 0 ? void 0 : filters.status) === "active") {
                qb.andWhere("user.is_active = true").andWhere("(user.locked_until IS NULL OR user.locked_until < :now)", { now: new Date() });
            }
            else if ((filters === null || filters === void 0 ? void 0 : filters.status) === "inactive") {
                qb.andWhere("user.is_active = false");
            }
            else if ((filters === null || filters === void 0 ? void 0 : filters.status) === "locked") {
                qb.andWhere("user.locked_until > :now", { now: new Date() });
            }
        }
        if (search === null || search === void 0 ? void 0 : search.trim()) {
            const pattern = `%${search.trim().toLowerCase()}%`;
            qb.andWhere("(LOWER(user.first_name) LIKE :pattern OR LOWER(user.last_name) LIKE :pattern OR LOWER(user.email) LIKE :pattern OR LOWER(COALESCE(user.title, '')) LIKE :pattern)", { pattern });
        }
        if (filters === null || filters === void 0 ? void 0 : filters.role) {
            qb.andWhere("user.role = :role", { role: filters.role });
        }
        if (filters === null || filters === void 0 ? void 0 : filters.origin) {
            qb.andWhere("user.created_via = :origin", { origin: filters.origin });
        }
        qb.orderBy("user.created_at", "DESC");
        qb.skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data: data.map((u) => (0, user_mapper_1.toUserResponse)(u, true)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
    async findOne(id, includePermissions = true) {
        const user = await this.usersRepository.findOne({
            where: { id },
            relations: this.userRelations,
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return (0, user_mapper_1.toUserResponse)(user, includePermissions);
    }
    async findOneEntity(id) {
        return this.usersRepository.findOne({
            where: { id },
            relations: this.userRelations,
        });
    }
    async findOneByEmail(email) {
        const normalizedEmail = email.trim().toLowerCase();
        return this.usersRepository.findOne({
            where: { email: normalizedEmail },
            relations: this.userRelations,
            select: [
                "id",
                "email",
                "password_hash",
                "first_name",
                "middle_name",
                "last_name",
                "is_active",
                "created_at",
                "updated_at",
                "role",
                "role_id",
                "avatar_url",
                "title",
                "failed_login_attempts",
                "locked_until",
            ],
        });
    }
    async update(id, userData, actingUser) {
        const { currentPassword, newPassword, role, avatar: _avatar, avatar_url, ...otherData } = userData;
        const updateObject = {
            ...otherData,
            ...(avatar_url !== undefined
                ? { avatar_url: avatar_url !== null && avatar_url !== void 0 ? avatar_url : undefined }
                : {}),
        };
        if (role) {
            const roleEntity = await this.accessSeeder.findRoleByKey(role);
            if (!roleEntity) {
                throw new common_1.NotFoundException(`Role "${role}" not found`);
            }
            if (roleEntity.key === "admin" &&
                actingUser &&
                actingUser.role !== "admin") {
                throw new common_1.ForbiddenException("Only administrators can assign the admin role");
            }
            updateObject.role = roleEntity.key;
            updateObject.role_id = roleEntity.id;
        }
        if (currentPassword && newPassword) {
            const user = await this.usersRepository.findOne({
                where: { id },
                select: ["id", "password_hash"],
            });
            if (!user) {
                throw new common_1.NotFoundException("User not found");
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isMatch) {
                throw new common_1.ForbiddenException("Current password is incorrect");
            }
            const salt = await bcrypt.genSalt(10);
            updateObject.password_hash = await bcrypt.hash(newPassword, salt);
        }
        await this.usersRepository.update(id, updateObject);
        await this.auditLogsService.logAction("user.updated", "user", id, (actingUser === null || actingUser === void 0 ? void 0 : actingUser.id) || null, { ...updateObject, password_hash: undefined });
        if (updateObject.is_active !== undefined) {
            await this.auditLogsService.logAction(updateObject.is_active ? "user.activated" : "user.deactivated", "user", id, (actingUser === null || actingUser === void 0 ? void 0 : actingUser.id) || null, { is_active: updateObject.is_active });
        }
        return this.findOne(id);
    }
    async updateLoginStatus(id, status) {
        await this.usersRepository.update(id, status);
    }
    async updateMfaSecret(id, secret) {
        await this.usersRepository.update(id, { mfa_secret: secret });
    }
    async enableMfa(id) {
        await this.usersRepository.update(id, { mfa_enabled: true });
        await this.auditLogsService.logAction("user.mfa_enabled", "user", id, id, {});
    }
    async disableMfa(id) {
        await this.usersRepository.update(id, {
            mfa_enabled: false,
            mfa_secret: null,
        });
        await this.auditLogsService.logAction("user.mfa_disabled", "user", id, id, {});
    }
    async updateAvatar(id, avatarUrl) {
        await this.usersRepository.update(id, { avatar_url: avatarUrl });
    }
    async changePassword(userId, changePasswordDto, overrideCurrentPasswordCheck = false) {
        const { currentPassword, newPassword } = changePasswordDto;
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            select: ["id", "password_hash"],
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        if (!overrideCurrentPasswordCheck) {
            const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isMatch) {
                throw new common_1.ForbiddenException("Current password is incorrect");
            }
        }
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);
        await this.usersRepository.update(userId, {
            password_hash: newHash,
            password_changed_at: new Date(),
        });
        await this.auditLogsService.logAction("user.password_changed", "user", userId, userId, {});
        return { message: "Password changed successfully" };
    }
    async adminResetPassword(id, actingUser) {
        const user = await this.findOneEntity(id);
        if (!user)
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        if (user.role === "admin" && actingUser.role !== "admin") {
            throw new common_1.ForbiddenException("Only administrators can reset admin passwords");
        }
        const temporaryPassword = (0, crypto_1.randomBytes)(12).toString("base64").slice(0, 16);
        await this.setPasswordFromPlain(id, temporaryPassword);
        await this.auditLogsService.logAction("user.admin_password_reset", "user", id, actingUser.id || null, {});
        return { temporary_password: temporaryPassword };
    }
    async forceLogout(id, actingUser) {
        const user = await this.findOneEntity(id);
        if (!user)
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        this.events.emit("user.force_logout", { userId: id });
        await this.auditLogsService.logAction("user.force_logout", "user", id, actingUser.id || null, {});
        return { message: "All sessions revoked" };
    }
    async exportData(id) {
        const user = await this.findOneEntity(id);
        if (!user)
            throw new common_1.NotFoundException("User not found");
        const logs = await this.auditLogsService.findByEntity("user", id);
        return {
            profile: {
                id: user.id,
                first_name: user.first_name,
                middle_name: user.middle_name,
                last_name: user.last_name,
                email: user.email,
                title: user.title,
                created_at: user.created_at,
                updated_at: user.updated_at,
                last_login_at: user.last_login_at,
                created_via: user.created_via,
            },
            audit_logs: logs,
        };
    }
    async anonymize(id, actingUserId) {
        const user = await this.findOneEntity(id);
        if (!user)
            throw new common_1.NotFoundException("User not found");
        if (user.role === "admin") {
            const activeAdmins = await this.usersRepository.count({
                where: { role: "admin", is_active: true, deleted_at: (0, typeorm_2.IsNull)() },
            });
            if (activeAdmins <= 1) {
                throw new common_1.ConflictException("Cannot anonymize the last active admin user");
            }
        }
        await this.usersRepository.update(id, {
            first_name: "Anonymized",
            last_name: "User",
            middle_name: "",
            email: `anonymized-${id}@deleted.local`,
            avatar_url: "",
            title: "",
            is_active: false,
        });
        await this.usersRepository.softDelete(id);
        this.events.emit("user.deleted", { userId: id });
        await this.auditLogsService.logAction("user.anonymized", "user", id, actingUserId || id, { message: "User PII anonymized according to GDPR right to erasure" });
    }
    async remove(id, actingUser) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        if ((actingUser === null || actingUser === void 0 ? void 0 : actingUser.id) === id) {
            throw new common_1.BadRequestException("You cannot delete your own account");
        }
        if (user.role === "admin") {
            const adminCount = await this.usersRepository.count({
                where: { role: "admin", is_active: true },
            });
            if (adminCount <= 1) {
                throw new common_1.BadRequestException("Cannot remove the last administrator");
            }
        }
        const result = await this.usersRepository.softDelete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        await this.auditLogsService.logAction("user.deleted", "user", id, (actingUser === null || actingUser === void 0 ? void 0 : actingUser.id) || null, { email: user.email });
    }
    async restore(id, actingUser) {
        const result = await this.usersRepository.restore(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        await this.auditLogsService.logAction("user.restored", "user", id, (actingUser === null || actingUser === void 0 ? void 0 : actingUser.id) || null, {});
    }
    async backfillRoleIds() {
        var _a;
        const users = await this.usersRepository.find({ where: {} });
        for (const user of users) {
            if (user.role_id)
                continue;
            const key = (_a = user.role) !== null && _a !== void 0 ? _a : "staff";
            const roleEntity = await this.accessSeeder.findRoleByKey(key);
            if (!roleEntity)
                continue;
            await this.usersRepository.update(user.id, {
                role_id: roleEntity.id,
                role: roleEntity.key,
            });
        }
    }
    async inviteUser(id, actingUser) {
        const user = await this.findOneEntity(id);
        if (!user)
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        if (user.role === "admin" && actingUser.role !== "admin") {
            throw new common_1.ForbiddenException("Only administrators can invite admin users");
        }
        const tokenPlain = (0, crypto_1.randomBytes)(32).toString("hex");
        const tokenHash = await bcrypt.hash(tokenPlain, 10);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await this.passwordResetTokenRepository.save({
            user_id: user.id,
            token_hash: tokenHash,
            expires_at: expiresAt,
        });
        await this.auditLogsService.logAction("user.invited", "user", id, actingUser.id || null, {});
        console.log(`[DEV] Invite link: http://localhost:3000/accept-invite?token=${tokenPlain}&email=${encodeURIComponent(user.email)}`);
        return { message: "Invitation sent successfully" };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(password_reset_token_entity_1.PasswordResetToken)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        access_seeder_service_1.AccessSeederService,
        event_emitter_1.EventEmitter2,
        audit_logs_service_1.AuditLogsService,
        typeorm_2.Repository])
], UsersService);
