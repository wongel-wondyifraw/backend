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
const access_seeder_service_1 = require("../access/access.seeder.service");
const user_mapper_1 = require("./user.mapper");
const notification_events_1 = require("../notifications/notification-events");
let UsersService = class UsersService {
    constructor(usersRepository, accessSeeder, events) {
        this.usersRepository = usersRepository;
        this.accessSeeder = accessSeeder;
        this.events = events;
        this.userRelations = { roleEntity: { permissions: true } };
    }
    async create(createUserDto) {
        var _a;
        const { password_hash, avatar, avatar_url, password, role, ...rest } = createUserDto;
        const roleEntity = await this.accessSeeder.findRoleByKey(role !== null && role !== void 0 ? role : "staff");
        if (!roleEntity) {
            throw new common_1.NotFoundException(`Role "${role}" not found`);
        }
        const userData = {
            ...rest,
            email: (_a = rest.email) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase(),
            avatar_url: avatar_url,
            role: roleEntity.key,
            role_id: roleEntity.id,
            roleEntity,
            is_active: rest.is_active === "true" || rest.is_active === true,
            created_at: rest.created_at || new Date(),
        };
        const plainPassword = password_hash !== null && password_hash !== void 0 ? password_hash : password;
        if (plainPassword) {
            userData.password_hash = await this.hashPassword(plainPassword);
        }
        const user = this.usersRepository.create(userData);
        const saved = await this.usersRepository.save(user);
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
    async findAll() {
        const users = await this.usersRepository.find({
            relations: this.userRelations,
        });
        return users.map((u) => (0, user_mapper_1.toUserResponse)(u, true));
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
            ],
        });
    }
    async update(id, userData) {
        const { currentPassword, newPassword, role, ...otherData } = userData;
        const updateObject = { ...otherData };
        if (role) {
            const roleEntity = await this.accessSeeder.findRoleByKey(role);
            if (!roleEntity) {
                throw new common_1.NotFoundException(`Role "${role}" not found`);
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
        return this.findOne(id);
    }
    async updateAvatar(id, avatarUrl) {
        await this.usersRepository.update(id, { avatar_url: avatarUrl });
    }
    async changePassword(userId, changePasswordDto) {
        const { currentPassword, newPassword } = changePasswordDto;
        const user = await this.usersRepository.findOne({
            where: { id: userId },
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
        const newHash = await bcrypt.hash(newPassword, salt);
        await this.usersRepository.update(userId, { password_hash: newHash });
        return { message: "Password changed successfully" };
    }
    async remove(id) {
        const result = await this.usersRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        access_seeder_service_1.AccessSeederService,
        event_emitter_1.EventEmitter2])
], UsersService);
