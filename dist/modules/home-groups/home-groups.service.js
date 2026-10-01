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
exports.HomeGroupsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const home_group_entity_1 = require("./entities/home-group.entity");
const home_group_member_entity_1 = require("./entities/home-group-member.entity");
const notification_events_1 = require("../notifications/notification-events");
const leader_resolver_service_1 = require("../../common/leadership/leader-resolver.service");
let HomeGroupsService = class HomeGroupsService {
    constructor(homeGroupsRepository, homeGroupMembersRepository, events, leaders) {
        this.homeGroupsRepository = homeGroupsRepository;
        this.homeGroupMembersRepository = homeGroupMembersRepository;
        this.events = events;
        this.leaders = leaders;
    }
    normalizeLeader(dto) {
        if (!dto.leader_id) {
            return { leader_id: null, leader_type: null };
        }
        return {
            leader_id: dto.leader_id,
            leader_type: dto.leader_type || "member",
        };
    }
    async create(dto) {
        var _a, _b;
        const leader = this.normalizeLeader(dto);
        const homeGroup = this.homeGroupsRepository.create({
            name: dto.name,
            about: (_a = dto.about) !== null && _a !== void 0 ? _a : null,
            schedule: (_b = dto.schedule) !== null && _b !== void 0 ? _b : null,
            location: dto.location,
            ...leader,
        });
        const saved = await this.homeGroupsRepository.save(homeGroup);
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: "home_group.created",
            kind: "home_group",
            severity: "success",
            title: "New home group created",
            message: `${saved.name} was added.`,
            href: `/members/home-groups/details/${saved.id}`,
            dedupeKey: `home_group.created:${saved.id}`,
            targetRoles: ["admin", "minister"],
        });
        return this.findOne(saved.id);
    }
    async findAllPaginated(page = 1, limit = 20, search) {
        const qb = this.homeGroupsRepository.createQueryBuilder("home_group");
        if (search === null || search === void 0 ? void 0 : search.trim()) {
            const pattern = `%${search.trim().toLowerCase()}%`;
            qb.where("LOWER(home_group.name) LIKE :pattern OR LOWER(home_group.location) LIKE :pattern", { pattern });
        }
        qb.orderBy("home_group.created_at", "DESC");
        qb.skip((page - 1) * limit).take(limit);
        const [rows, total] = await qb.getManyAndCount();
        const data = await this.leaders.attachLeaders(rows);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
    async findOne(id) {
        const homeGroup = await this.homeGroupsRepository.findOne({
            where: { id },
        });
        if (!homeGroup) {
            throw new common_1.NotFoundException(`Home group with ID ${id} not found`);
        }
        const [withLeader] = await this.leaders.attachLeaders([homeGroup]);
        return withLeader;
    }
    async update(id, dto) {
        const patch = { ...dto };
        if ("leader_id" in dto || "leader_type" in dto) {
            Object.assign(patch, this.normalizeLeader(dto));
        }
        await this.homeGroupsRepository.update(id, patch);
        const homeGroup = await this.findOne(id);
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: "home_group.updated",
            kind: "home_group",
            severity: "info",
            title: "Home group updated",
            message: `${homeGroup.name} was updated.`,
            href: `/members/home-groups/details/${id}`,
            dedupeKey: `home_group.updated:${id}:${Date.now()}`,
            targetRoles: ["admin", "minister"],
        });
        return homeGroup;
    }
    async remove(id) {
        const homeGroup = await this.homeGroupsRepository.findOne({
            where: { id },
        });
        const result = await this.homeGroupsRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Home group with ID ${id} not found`);
        }
        if (homeGroup) {
            this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
                eventName: "home_group.deleted",
                kind: "home_group",
                severity: "warning",
                title: "Home group removed",
                message: `${homeGroup.name} was removed.`,
                dedupeKey: `home_group.deleted:${id}`,
                targetRoles: ["admin", "minister"],
            });
        }
    }
    async addMember(homeGroupId, memberId) {
        const existing = await this.homeGroupMembersRepository.findOne({
            where: { home_group_id: homeGroupId, member_id: memberId },
        });
        if (existing) {
            throw new common_1.ConflictException("Member is already in this home group");
        }
        const record = this.homeGroupMembersRepository.create({
            home_group_id: homeGroupId,
            member_id: memberId,
        });
        const saved = await this.homeGroupMembersRepository.save(record);
        const homeGroup = await this.findOne(homeGroupId);
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: "home_group.member.added",
            kind: "home_group",
            severity: "info",
            title: "Home group membership updated",
            message: `A member was added to ${homeGroup.name}.`,
            href: `/members/home-groups/details/${homeGroupId}`,
            dedupeKey: `home_group.member.added:${homeGroupId}:${memberId}`,
            targetRoles: ["admin", "minister"],
        });
        return saved;
    }
    async removeMember(homeGroupId, memberId) {
        const homeGroup = await this.findOne(homeGroupId);
        const result = await this.homeGroupMembersRepository.delete({
            home_group_id: homeGroupId,
            member_id: memberId,
        });
        if (result.affected === 0) {
            throw new common_1.NotFoundException("Member not found in this home group");
        }
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: "home_group.member.removed",
            kind: "home_group",
            severity: "info",
            title: "Home group membership updated",
            message: `A member was removed from ${homeGroup.name}.`,
            href: `/members/home-groups/details/${homeGroupId}`,
            dedupeKey: `home_group.member.removed:${homeGroupId}:${memberId}`,
            targetRoles: ["admin", "minister"],
        });
    }
    async getHomeGroupMembers(homeGroupId) {
        return this.homeGroupMembersRepository.find({
            where: { home_group_id: homeGroupId },
            relations: ["member"],
            order: { joined_at: "DESC" },
        });
    }
};
exports.HomeGroupsService = HomeGroupsService;
exports.HomeGroupsService = HomeGroupsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(home_group_entity_1.HomeGroup)),
    __param(1, (0, typeorm_1.InjectRepository)(home_group_member_entity_1.HomeGroupMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        event_emitter_1.EventEmitter2,
        leader_resolver_service_1.LeaderResolverService])
], HomeGroupsService);
