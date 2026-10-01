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
exports.BibleStudiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const bible_study_entity_1 = require("./entities/bible-study.entity");
const bible_study_member_entity_1 = require("./entities/bible-study-member.entity");
const notification_events_1 = require("../notifications/notification-events");
const bible_books_1 = require("../../common/constants/bible-books");
const leader_resolver_service_1 = require("../../common/leadership/leader-resolver.service");
let BibleStudiesService = class BibleStudiesService {
    constructor(bibleStudiesRepository, bibleStudyMembersRepository, events, leaders) {
        this.bibleStudiesRepository = bibleStudiesRepository;
        this.bibleStudyMembersRepository = bibleStudyMembersRepository;
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
        var _a, _b, _c, _d;
        if (dto.content_type === "book") {
            if (!dto.bible_book || !bible_books_1.BIBLE_BOOK_SET.has(dto.bible_book)) {
                throw new common_1.BadRequestException("A valid Bible book is required when content type is Book");
            }
        }
        const leader = this.normalizeLeader(dto);
        const study = this.bibleStudiesRepository.create({
            name: dto.name,
            about: (_a = dto.about) !== null && _a !== void 0 ? _a : null,
            schedule: (_b = dto.schedule) !== null && _b !== void 0 ? _b : null,
            location: dto.location,
            content_type: dto.content_type,
            ...leader,
            bible_book: dto.content_type === "book" ? ((_c = dto.bible_book) !== null && _c !== void 0 ? _c : null) : null,
            material_url: dto.content_type === "study_material"
                ? ((_d = dto.material_url) !== null && _d !== void 0 ? _d : null)
                : null,
        });
        const saved = await this.bibleStudiesRepository.save(study);
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: "bible_study.created",
            kind: "system",
            severity: "success",
            title: "New Bible study created",
            message: `${saved.name} was added.`,
            href: `/bible-study/details/${saved.id}`,
            dedupeKey: `bible_study.created:${saved.id}`,
            targetRoles: ["admin", "minister"],
        });
        return this.findOne(saved.id);
    }
    async findAllPaginated(page = 1, limit = 20, search) {
        const qb = this.bibleStudiesRepository.createQueryBuilder("bible_study");
        if (search === null || search === void 0 ? void 0 : search.trim()) {
            const pattern = `%${search.trim().toLowerCase()}%`;
            qb.where("LOWER(bible_study.name) LIKE :pattern OR LOWER(bible_study.location) LIKE :pattern OR LOWER(bible_study.bible_book) LIKE :pattern", { pattern });
        }
        qb.orderBy("bible_study.created_at", "DESC");
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
        const study = await this.bibleStudiesRepository.findOne({ where: { id } });
        if (!study) {
            throw new common_1.NotFoundException(`Bible study with ID ${id} not found`);
        }
        const [withLeader] = await this.leaders.attachLeaders([study]);
        return withLeader;
    }
    async update(id, dto) {
        var _a, _b, _c, _d, _e, _f;
        const existing = await this.findOne(id);
        const contentType = (_a = dto.content_type) !== null && _a !== void 0 ? _a : existing.content_type;
        if (contentType === "book") {
            const book = (_b = dto.bible_book) !== null && _b !== void 0 ? _b : existing.bible_book;
            if (!book || !bible_books_1.BIBLE_BOOK_SET.has(book)) {
                throw new common_1.BadRequestException("A valid Bible book is required when content type is Book");
            }
        }
        const patch = {
            content_type: contentType,
        };
        if (dto.name !== undefined)
            patch.name = dto.name;
        if (dto.about !== undefined)
            patch.about = (_c = dto.about) !== null && _c !== void 0 ? _c : null;
        if (dto.schedule !== undefined)
            patch.schedule = (_d = dto.schedule) !== null && _d !== void 0 ? _d : null;
        if (dto.location !== undefined)
            patch.location = dto.location;
        if ("leader_id" in dto || "leader_type" in dto) {
            Object.assign(patch, this.normalizeLeader(dto));
        }
        if (contentType === "book") {
            patch.bible_book = (_e = dto.bible_book) !== null && _e !== void 0 ? _e : existing.bible_book;
            patch.material_url = null;
        }
        else {
            patch.bible_book = null;
            if (dto.material_url !== undefined) {
                patch.material_url = (_f = dto.material_url) !== null && _f !== void 0 ? _f : null;
            }
        }
        await this.bibleStudiesRepository.update(id, patch);
        const study = await this.findOne(id);
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: "bible_study.updated",
            kind: "system",
            severity: "info",
            title: "Bible study updated",
            message: `${study.name} was updated.`,
            href: `/bible-study/details/${id}`,
            dedupeKey: `bible_study.updated:${id}:${Date.now()}`,
            targetRoles: ["admin", "minister"],
        });
        return study;
    }
    async remove(id) {
        const study = await this.bibleStudiesRepository.findOne({ where: { id } });
        const result = await this.bibleStudiesRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Bible study with ID ${id} not found`);
        }
        if (study) {
            this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
                eventName: "bible_study.deleted",
                kind: "system",
                severity: "warning",
                title: "Bible study removed",
                message: `${study.name} was removed.`,
                dedupeKey: `bible_study.deleted:${id}`,
                targetRoles: ["admin", "minister"],
            });
        }
    }
    async addMember(bibleStudyId, memberId) {
        const existing = await this.bibleStudyMembersRepository.findOne({
            where: { bible_study_id: bibleStudyId, member_id: memberId },
        });
        if (existing) {
            throw new common_1.ConflictException("Member is already in this Bible study");
        }
        const record = this.bibleStudyMembersRepository.create({
            bible_study_id: bibleStudyId,
            member_id: memberId,
        });
        const saved = await this.bibleStudyMembersRepository.save(record);
        const study = await this.findOne(bibleStudyId);
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: "bible_study.member.added",
            kind: "system",
            severity: "info",
            title: "Bible study membership updated",
            message: `A member was added to ${study.name}.`,
            href: `/bible-study/details/${bibleStudyId}`,
            dedupeKey: `bible_study.member.added:${bibleStudyId}:${memberId}`,
            targetRoles: ["admin", "minister"],
        });
        return saved;
    }
    async removeMember(bibleStudyId, memberId) {
        const study = await this.findOne(bibleStudyId);
        const result = await this.bibleStudyMembersRepository.delete({
            bible_study_id: bibleStudyId,
            member_id: memberId,
        });
        if (result.affected === 0) {
            throw new common_1.NotFoundException("Member not found in this Bible study");
        }
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: "bible_study.member.removed",
            kind: "system",
            severity: "info",
            title: "Bible study membership updated",
            message: `A member was removed from ${study.name}.`,
            href: `/bible-study/details/${bibleStudyId}`,
            dedupeKey: `bible_study.member.removed:${bibleStudyId}:${memberId}`,
            targetRoles: ["admin", "minister"],
        });
    }
    async getMembers(bibleStudyId) {
        return this.bibleStudyMembersRepository.find({
            where: { bible_study_id: bibleStudyId },
            relations: ["member"],
            order: { joined_at: "DESC" },
        });
    }
};
exports.BibleStudiesService = BibleStudiesService;
exports.BibleStudiesService = BibleStudiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bible_study_entity_1.BibleStudy)),
    __param(1, (0, typeorm_1.InjectRepository)(bible_study_member_entity_1.BibleStudyMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        event_emitter_1.EventEmitter2,
        leader_resolver_service_1.LeaderResolverService])
], BibleStudiesService);
