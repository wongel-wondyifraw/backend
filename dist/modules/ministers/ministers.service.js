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
exports.MinistersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const crypto_1 = require("crypto");
const minister_entity_1 = require("./entities/minister.entity");
const users_service_1 = require("../users/users.service");
const notification_events_1 = require("../notifications/notification-events");
let MinistersService = class MinistersService {
    constructor(ministersRepository, usersService, events) {
        this.ministersRepository = ministersRepository;
        this.usersService = usersService;
        this.events = events;
    }
    generatePassword(length = 12) {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
        const bytes = (0, crypto_1.randomBytes)(length);
        return Array.from(bytes, (b) => chars[b % chars.length]).join("");
    }
    async create(dto, actingUser) {
        var _a, _b, _c, _d, _e;
        const email = dto.email.trim().toLowerCase();
        if (!email) {
            throw new common_1.BadRequestException("Email is required to create a minister login");
        }
        const existingUser = await this.usersService.findOneByEmail(email);
        if (existingUser) {
            throw new common_1.ConflictException("A user with this email already exists");
        }
        const existingMinister = await this.ministersRepository.findOne({
            where: { email },
        });
        if (existingMinister) {
            throw new common_1.ConflictException("A minister with this email already exists");
        }
        const temporaryPassword = this.generatePassword();
        const isActive = ((_a = dto.status) !== null && _a !== void 0 ? _a : "active").toLowerCase() !== "inactive";
        const user = await this.usersService.create({
            first_name: dto.first_name,
            middle_name: (_b = dto.middle_name) !== null && _b !== void 0 ? _b : "",
            last_name: dto.last_name,
            email,
            password: temporaryPassword,
            role: "minister",
            title: (_c = dto.title) !== null && _c !== void 0 ? _c : undefined,
            avatar_url: (_d = dto.image_url) !== null && _d !== void 0 ? _d : undefined,
            is_active: isActive,
            created_via: "minister_module",
        }, actingUser);
        const minister = this.ministersRepository.create({
            ...dto,
            email,
            user_id: user.id,
            status: (_e = dto.status) !== null && _e !== void 0 ? _e : "active",
        });
        const saved = await this.ministersRepository.save(minister);
        const name = `${saved.first_name} ${saved.last_name}`.trim();
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: "minister.created",
            kind: "user",
            severity: "success",
            title: "New minister registered",
            message: `${name} was registered with a login account.`,
            href: `/ministers/details/${saved.id}`,
            dedupeKey: `minister.created:${saved.id}`,
            targetRoles: ["admin"],
        });
        return Object.assign(saved, { temporary_password: temporaryPassword });
    }
    async findAllPaginated(page = 1, limit = 20, search, status) {
        const qb = this.ministersRepository.createQueryBuilder("minister");
        if (search === null || search === void 0 ? void 0 : search.trim()) {
            const pattern = `%${search.trim().toLowerCase()}%`;
            qb.where("LOWER(minister.first_name) LIKE :pattern OR LOWER(minister.last_name) LIKE :pattern OR LOWER(minister.email) LIKE :pattern OR minister.phone LIKE :pattern OR LOWER(minister.title) LIKE :pattern", { pattern });
        }
        if (status === null || status === void 0 ? void 0 : status.trim()) {
            qb.andWhere("LOWER(minister.status) = :status", {
                status: status.trim().toLowerCase(),
            });
        }
        qb.orderBy("minister.created_at", "DESC");
        qb.skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
    async findOne(id) {
        var _a, _b, _c;
        const minister = await this.ministersRepository.findOne({
            where: { id },
            relations: { user: { roleEntity: true } },
        });
        if (!minister) {
            throw new common_1.NotFoundException(`Minister with ID ${id} not found`);
        }
        if (minister.user) {
            const roleKey = (_c = (_b = (_a = minister.user.roleEntity) === null || _a === void 0 ? void 0 : _a.key) !== null && _b !== void 0 ? _b : minister.user.role) !== null && _c !== void 0 ? _c : "minister";
            // Expose a stable role string for the client without nested roleEntity noise
            minister.user.role = roleKey;
        }
        return minister;
    }
    async update(id, dto, actingUser) {
        const minister = await this.findOne(id);
        await this.ministersRepository.update(id, dto);
        const userPatch = {};
        if (dto.first_name !== undefined)
            userPatch.first_name = dto.first_name;
        if (dto.middle_name !== undefined)
            userPatch.middle_name = dto.middle_name;
        if (dto.last_name !== undefined)
            userPatch.last_name = dto.last_name;
        if (dto.title !== undefined)
            userPatch.title = dto.title;
        if (dto.image_url !== undefined)
            userPatch.avatar_url = dto.image_url;
        if (dto.status !== undefined) {
            userPatch.is_active = dto.status.toLowerCase() !== "inactive";
        }
        if (Object.keys(userPatch).length > 0) {
            await this.usersService.update(minister.user_id, userPatch, actingUser);
        }
        const updated = await this.findOne(id);
        const name = `${updated.first_name} ${updated.last_name}`.trim();
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: "minister.updated",
            kind: "user",
            severity: "info",
            title: "Minister updated",
            message: `${name}'s profile was updated.`,
            href: `/ministers/details/${id}`,
            dedupeKey: `minister.updated:${id}:${Date.now()}`,
            targetRoles: ["admin"],
        });
        return updated;
    }
    async resetPassword(id) {
        const minister = await this.findOne(id);
        const temporaryPassword = this.generatePassword();
        await this.usersService.setPasswordFromPlain(minister.user_id, temporaryPassword);
        const name = `${minister.first_name} ${minister.last_name}`.trim();
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: "minister.password_reset",
            kind: "user",
            severity: "warning",
            title: "Minister password reset",
            message: `Login password was reset for ${name}.`,
            href: `/ministers/details/${id}`,
            dedupeKey: `minister.password_reset:${id}:${Date.now()}`,
            targetRoles: ["admin"],
        });
        return { temporary_password: temporaryPassword };
    }
    async remove(id, actingUser) {
        const minister = await this.findOne(id);
        const userId = minister.user_id;
        const name = `${minister.first_name} ${minister.last_name}`.trim();
        await this.ministersRepository.delete(id);
        try {
            await this.usersService.remove(userId, actingUser);
        }
        catch (_a) {
            // User may already be gone
        }
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: "minister.deleted",
            kind: "user",
            severity: "warning",
            title: "Minister removed",
            message: `${name} and their login account were removed.`,
            dedupeKey: `minister.deleted:${id}`,
            targetRoles: ["admin"],
        });
    }
};
exports.MinistersService = MinistersService;
exports.MinistersService = MinistersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(minister_entity_1.Minister)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService,
        event_emitter_1.EventEmitter2])
], MinistersService);
