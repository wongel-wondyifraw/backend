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
const name_normalizer_1 = require("../../common/utils/name-normalizer");
const ethiopian_calendar_1 = require("../../common/utils/ethiopian-calendar");
const calendar_dto_helper_1 = require("../../common/utils/calendar-dto.helper");
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
        const { ministry_ids, date_of_birth, date_of_birth_calendar, date_of_birth_precision, joined_date, joined_date_calendar, joined_date_precision, salvation_date, salvation_date_calendar, salvation_date_precision, ...memberData } = createMemberDto;
        await this.assertEmailAvailable(memberData.email);
        const normalizedPayload = {
            ...memberData,
            first_name: (0, name_normalizer_1.normalizePersonName)(memberData.first_name),
            ...(memberData.middle_name !== undefined
                ? { middle_name: (0, name_normalizer_1.normalizePersonName)(memberData.middle_name) }
                : {}),
            last_name: (0, name_normalizer_1.normalizePersonName)(memberData.last_name),
            ...(memberData.profession !== undefined
                ? { profession: (0, name_normalizer_1.normalizeTitleInitials)(memberData.profession) }
                : {}),
            ...(memberData.employer !== undefined
                ? { employer: (0, name_normalizer_1.normalizeTitleInitials)(memberData.employer) }
                : {}),
            ...(memberData.education_field !== undefined
                ? { education_field: (0, name_normalizer_1.normalizeTitleInitials)(memberData.education_field) }
                : {}),
        };
        const resolvedDob = (0, calendar_dto_helper_1.resolveDateFieldForWrite)("date_of_birth", date_of_birth, {
            calendar: date_of_birth_calendar,
            precision: date_of_birth_precision,
            allowPartial: true,
        });
        if (resolvedDob !== undefined) {
            normalizedPayload.date_of_birth = resolvedDob.value;
            normalizedPayload.date_of_birth_precision = resolvedDob.precision;
            normalizedPayload.date_of_birth_calendar = resolvedDob.calendar;
        }
        const resolvedJoined = (0, calendar_dto_helper_1.resolveDateFieldForWrite)("joined_date", joined_date, {
            calendar: joined_date_calendar,
            precision: joined_date_precision,
            allowPartial: true,
        });
        if (resolvedJoined !== undefined) {
            normalizedPayload.joined_date = resolvedJoined.value;
            normalizedPayload.joined_date_precision = resolvedJoined.precision;
            normalizedPayload.joined_date_calendar = resolvedJoined.calendar;
        }
        const resolvedSalvation = (0, calendar_dto_helper_1.resolveDateFieldForWrite)("salvation_date", salvation_date, {
            calendar: salvation_date_calendar,
            precision: salvation_date_precision,
            allowPartial: true,
        });
        if (resolvedSalvation !== undefined) {
            normalizedPayload.salvation_date = resolvedSalvation.value;
            normalizedPayload.salvation_date_precision = resolvedSalvation.precision;
            normalizedPayload.salvation_date_calendar = resolvedSalvation.calendar;
        }
        const member = this.membersRepository.create(normalizedPayload);
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
        var _a, _b, _c, _d;
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
            const boundFrom = (_c = (0, ethiopian_calendar_1.resolveFilterDateBound)(filters.joined_from, "start", filters.joined_calendar)) !== null && _c !== void 0 ? _c : filters.joined_from;
            qb.andWhere("COALESCE(member.joined_date, CAST(member.created_at AS date)) >= :joinedFrom", { joinedFrom: boundFrom });
        }
        if (filters === null || filters === void 0 ? void 0 : filters.joined_to) {
            const boundTo = (_d = (0, ethiopian_calendar_1.resolveFilterDateBound)(filters.joined_to, "end", filters.joined_calendar)) !== null && _d !== void 0 ? _d : filters.joined_to;
            qb.andWhere("COALESCE(member.joined_date, CAST(member.created_at AS date)) <= :joinedTo", { joinedTo: boundTo });
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
        const { ministry_ids, date_of_birth, date_of_birth_calendar, date_of_birth_precision, joined_date, joined_date_calendar, joined_date_precision, salvation_date, salvation_date_calendar, salvation_date_precision, ...memberData } = updateMemberDto;
        if (memberData.email !== undefined) {
            await this.assertEmailAvailable(memberData.email, id);
        }
        const memberPatch = {
            ...memberData,
            ...(memberData.first_name !== undefined
                ? { first_name: (0, name_normalizer_1.normalizePersonName)(memberData.first_name) }
                : {}),
            ...(memberData.middle_name !== undefined
                ? { middle_name: (0, name_normalizer_1.normalizePersonName)(memberData.middle_name) }
                : {}),
            ...(memberData.last_name !== undefined
                ? { last_name: (0, name_normalizer_1.normalizePersonName)(memberData.last_name) }
                : {}),
            ...(memberData.profession !== undefined
                ? { profession: (0, name_normalizer_1.normalizeTitleInitials)(memberData.profession) }
                : {}),
            ...(memberData.employer !== undefined
                ? { employer: (0, name_normalizer_1.normalizeTitleInitials)(memberData.employer) }
                : {}),
            ...(memberData.education_field !== undefined
                ? { education_field: (0, name_normalizer_1.normalizeTitleInitials)(memberData.education_field) }
                : {}),
        };
        const resolvedDob = (0, calendar_dto_helper_1.resolveDateFieldForWrite)("date_of_birth", date_of_birth, {
            calendar: date_of_birth_calendar,
            precision: date_of_birth_precision,
            allowPartial: true,
        });
        if (resolvedDob !== undefined) {
            memberPatch.date_of_birth = resolvedDob.value;
            memberPatch.date_of_birth_precision = resolvedDob.precision;
            memberPatch.date_of_birth_calendar = resolvedDob.calendar;
        }
        const resolvedJoined = (0, calendar_dto_helper_1.resolveDateFieldForWrite)("joined_date", joined_date, {
            calendar: joined_date_calendar,
            precision: joined_date_precision,
            allowPartial: true,
        });
        if (resolvedJoined !== undefined) {
            memberPatch.joined_date = resolvedJoined.value;
            memberPatch.joined_date_precision = resolvedJoined.precision;
            memberPatch.joined_date_calendar = resolvedJoined.calendar;
        }
        const resolvedSalvation = (0, calendar_dto_helper_1.resolveDateFieldForWrite)("salvation_date", salvation_date, {
            calendar: salvation_date_calendar,
            precision: salvation_date_precision,
            allowPartial: true,
        });
        if (resolvedSalvation !== undefined) {
            memberPatch.salvation_date = resolvedSalvation.value;
            memberPatch.salvation_date_precision = resolvedSalvation.precision;
            memberPatch.salvation_date_calendar = resolvedSalvation.calendar;
        }
        if (Object.keys(memberPatch).length > 0) {
            await this.membersRepository.update(id, memberPatch);
        }
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
