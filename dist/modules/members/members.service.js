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
exports.MembersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const member_entity_1 = require("./entities/member.entity");
const notification_events_1 = require("../notifications/notification-events");
let MembersService = class MembersService {
    constructor(membersRepository, events) {
        this.membersRepository = membersRepository;
        this.events = events;
    }
    async assertEmailAvailable(email, excludeId) {
        const normalized = email === null || email === void 0 ? void 0 : email.trim().toLowerCase();
        if (!normalized)
            return;
        const qb = this.membersRepository
            .createQueryBuilder("member")
            .where("LOWER(member.email) = :email", { email: normalized });
        if (excludeId) {
            qb.andWhere("member.id != :excludeId", { excludeId });
        }
        const existing = await qb.getOne();
        if (existing) {
            throw new common_1.ConflictException("A member with this email already exists");
        }
    }
    async create(createMemberDto) {
        const { ministry_ids, ...memberData } = createMemberDto;
        await this.assertEmailAvailable(memberData.email);
        const member = this.membersRepository.create(memberData);
        const saved = await this.membersRepository.save(member);
        if (ministry_ids && ministry_ids.length > 0) {
            const ministryMembers = ministry_ids.map((ministry_id) => ({
                ministry_id,
                member_id: saved.id,
            }));
            await this.membersRepository.manager
                .getRepository("MinistryMember")
                .save(ministryMembers);
        }
        const name = `${saved.first_name} ${saved.last_name}`.trim();
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: "member.created",
            kind: "member",
            severity: "success",
            title: "New member added",
            message: `${name} was added to the directory.`,
            href: `/members/${saved.id}`,
            dedupeKey: `member.created:${saved.id}`,
            targetRoles: ["admin", "minister"],
        });
        return saved;
    }
    async createBulk(items) {
        const errors = [];
        let created = 0;
        for (let i = 0; i < items.length; i += 1) {
            try {
                await this.create(items[i]);
                created += 1;
            }
            catch (err) {
                const message = err instanceof Error ? err.message : "Failed to create member";
                errors.push({ index: i, message });
            }
        }
        return { created, failed: errors.length, errors };
    }
    async findAllPaginated(page = 1, limit = 20, search, filters) {
        var _a, _b;
        const qb = this.membersRepository.createQueryBuilder("member");
        if (search === null || search === void 0 ? void 0 : search.trim()) {
            const pattern = `%${search.trim().toLowerCase()}%`;
            qb.andWhere("(LOWER(member.first_name) LIKE :pattern OR LOWER(member.last_name) LIKE :pattern OR LOWER(COALESCE(member.email, '')) LIKE :pattern OR COALESCE(member.phone, '') LIKE :pattern OR LOWER(COALESCE(member.address, '')) LIKE :pattern)", { pattern });
        }
        if ((_a = filters === null || filters === void 0 ? void 0 : filters.status) === null || _a === void 0 ? void 0 : _a.trim()) {
            qb.andWhere("LOWER(member.status) = :status", {
                status: filters.status.trim().toLowerCase(),
            });
        }
        if ((_b = filters === null || filters === void 0 ? void 0 : filters.marital_status) === null || _b === void 0 ? void 0 : _b.trim()) {
            qb.andWhere("LOWER(member.marital_status) = :marital", {
                marital: filters.marital_status.trim().toLowerCase(),
            });
        }
        if (filters === null || filters === void 0 ? void 0 : filters.joined_from) {
            qb.andWhere("COALESCE(member.joined_date, CAST(member.created_at AS date)) >= :joinedFrom", { joinedFrom: filters.joined_from });
        }
        if (filters === null || filters === void 0 ? void 0 : filters.joined_to) {
            qb.andWhere("COALESCE(member.joined_date, CAST(member.created_at AS date)) <= :joinedTo", { joinedTo: filters.joined_to });
        }
        const sortBy = (filters === null || filters === void 0 ? void 0 : filters.sort_by) || "created_at";
        const sortOrder = ((filters === null || filters === void 0 ? void 0 : filters.sort_order) || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
        if (sortBy === "visit_count") {
            qb.orderBy("member.visit_count", sortOrder).addOrderBy("member.created_at", "DESC");
        }
        else if (sortBy === "joined_date") {
            qb.orderBy("COALESCE(member.joined_date, CAST(member.created_at AS date))", sortOrder);
        }
        else {
            qb.orderBy("member.created_at", sortOrder);
        }
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
    async findAll() {
        return this.membersRepository.find({
            order: { created_at: "DESC" },
        });
    }
    async findOne(id) {
        const member = await this.membersRepository.findOne({
            where: { id },
            relations: ["ministry_members", "ministry_members.ministry", "location"],
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID ${id} not found`);
        }
        return member;
    }
    async update(id, updateMemberDto) {
        const { ministry_ids, ...memberData } = updateMemberDto;
        if (memberData.email !== undefined) {
            await this.assertEmailAvailable(memberData.email, id);
        }
        await this.membersRepository.update(id, memberData);
        if (ministry_ids !== undefined) {
            await this.membersRepository.manager
                .getRepository("MinistryMember")
                .delete({ member_id: id });
            if (ministry_ids.length > 0) {
                const ministryMembers = ministry_ids.map((ministry_id) => ({
                    ministry_id,
                    member_id: id,
                }));
                await this.membersRepository.manager
                    .getRepository("MinistryMember")
                    .save(ministryMembers);
            }
        }
        const member = await this.findOne(id);
        const name = `${member.first_name} ${member.last_name}`.trim();
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: "member.updated",
            kind: "member",
            severity: "info",
            title: "Member updated",
            message: `${name}'s profile was updated.`,
            href: `/members/${id}`,
            dedupeKey: `member.updated:${id}:${Date.now()}`,
            targetRoles: ["admin", "minister"],
        });
        return member;
    }
    async remove(id) {
        const member = await this.membersRepository.findOne({ where: { id } });
        const result = await this.membersRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Member with ID ${id} not found`);
        }
        if (member) {
            const name = `${member.first_name} ${member.last_name}`.trim();
            this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
                eventName: "member.deleted",
                kind: "member",
                severity: "warning",
                title: "Member removed",
                message: `${name} was removed from the directory.`,
                dedupeKey: `member.deleted:${id}`,
                targetRoles: ["admin", "minister"],
            });
        }
    }
};
exports.MembersService = MembersService;
exports.MembersService = MembersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(member_entity_1.Member)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], MembersService);
