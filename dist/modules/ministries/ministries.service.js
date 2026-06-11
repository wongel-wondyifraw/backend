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
exports.MinistriesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const ministry_entity_1 = require("./entities/ministry.entity");
const ministry_member_entity_1 = require("./entities/ministry-member.entity");
const notification_events_1 = require("../notifications/notification-events");
let MinistriesService = class MinistriesService {
    constructor(ministriesRepository, ministryMembersRepository, events) {
        this.ministriesRepository = ministriesRepository;
        this.ministryMembersRepository = ministryMembersRepository;
        this.events = events;
    }
    async create(createMinistryDto) {
        const ministry = this.ministriesRepository.create(createMinistryDto);
        const saved = await this.ministriesRepository.save(ministry);
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: 'ministry.created',
            kind: 'ministry',
            severity: 'success',
            title: 'New ministry created',
            message: `${saved.name} was added.`,
            href: `/ministries/${saved.id}`,
            dedupeKey: `ministry.created:${saved.id}`,
            targetRoles: ['admin', 'minister'],
        });
        return saved;
    }
    async findAllPaginated(page = 1, limit = 20, search) {
        const qb = this.ministriesRepository.createQueryBuilder('ministry')
            .leftJoinAndSelect('ministry.leader', 'leader');
        if (search === null || search === void 0 ? void 0 : search.trim()) {
            const pattern = `%${search.trim().toLowerCase()}%`;
            qb.where('LOWER(ministry.name) LIKE :pattern', { pattern });
        }
        qb.orderBy('ministry.created_at', 'DESC');
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
        return this.ministriesRepository.find({
            relations: ['leader'],
            order: { created_at: 'DESC' },
        });
    }
    async findOne(id) {
        const ministry = await this.ministriesRepository.findOne({
            where: { id },
            relations: ['leader'],
        });
        if (!ministry) {
            throw new common_1.NotFoundException(`Ministry with ID ${id} not found`);
        }
        return ministry;
    }
    async update(id, updateMinistryDto) {
        await this.ministriesRepository.update(id, updateMinistryDto);
        const ministry = await this.findOne(id);
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: 'ministry.updated',
            kind: 'ministry',
            severity: 'info',
            title: 'Ministry updated',
            message: `${ministry.name} was updated.`,
            href: `/ministries/${id}`,
            dedupeKey: `ministry.updated:${id}:${Date.now()}`,
            targetRoles: ['admin', 'minister'],
        });
        return ministry;
    }
    async remove(id) {
        const ministry = await this.ministriesRepository.findOne({ where: { id } });
        const result = await this.ministriesRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Ministry with ID ${id} not found`);
        }
        if (ministry) {
            this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
                eventName: 'ministry.deleted',
                kind: 'ministry',
                severity: 'warning',
                title: 'Ministry removed',
                message: `${ministry.name} was removed.`,
                dedupeKey: `ministry.deleted:${id}`,
                targetRoles: ['admin', 'minister'],
            });
        }
    }
    async addMember(ministryId, memberId) {
        const existing = await this.ministryMembersRepository.findOne({
            where: { ministry_id: ministryId, member_id: memberId },
        });
        if (existing) {
            throw new common_1.ConflictException('Member is already in this ministry');
        }
        const record = this.ministryMembersRepository.create({
            ministry_id: ministryId,
            member_id: memberId,
        });
        const saved = await this.ministryMembersRepository.save(record);
        const ministry = await this.findOne(ministryId);
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: 'ministry.member.added',
            kind: 'ministry',
            severity: 'info',
            title: 'Ministry membership updated',
            message: `A member was added to ${ministry.name}.`,
            href: `/ministries/${ministryId}`,
            dedupeKey: `ministry.member.added:${ministryId}:${memberId}`,
            targetRoles: ['admin', 'minister'],
        });
        return saved;
    }
    async removeMember(ministryId, memberId) {
        const ministry = await this.findOne(ministryId);
        const result = await this.ministryMembersRepository.delete({
            ministry_id: ministryId,
            member_id: memberId,
        });
        if (result.affected === 0) {
            throw new common_1.NotFoundException('Member not found in this ministry');
        }
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: 'ministry.member.removed',
            kind: 'ministry',
            severity: 'info',
            title: 'Ministry membership updated',
            message: `A member was removed from ${ministry.name}.`,
            href: `/ministries/${ministryId}`,
            dedupeKey: `ministry.member.removed:${ministryId}:${memberId}`,
            targetRoles: ['admin', 'minister'],
        });
    }
    async getMinistryMembers(ministryId) {
        return this.ministryMembersRepository.find({
            where: { ministry_id: ministryId },
            relations: ['member'],
            order: { joined_at: 'DESC' },
        });
    }
    async getMemberMinistries(memberId) {
        return this.ministryMembersRepository.find({
            where: { member_id: memberId },
            order: { joined_at: 'DESC' },
        });
    }
};
exports.MinistriesService = MinistriesService;
exports.MinistriesService = MinistriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ministry_entity_1.Ministry)),
    __param(1, (0, typeorm_1.InjectRepository)(ministry_member_entity_1.MinistryMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], MinistriesService);
