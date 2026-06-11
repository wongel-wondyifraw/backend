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
    async create(createMemberDto) {
        const member = this.membersRepository.create(createMemberDto);
        const saved = await this.membersRepository.save(member);
        const name = `${saved.first_name} ${saved.last_name}`.trim();
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: 'member.created',
            kind: 'member',
            severity: 'success',
            title: 'New member added',
            message: `${name} was added to the directory.`,
            href: `/members/${saved.id}`,
            dedupeKey: `member.created:${saved.id}`,
            targetRoles: ['admin', 'minister'],
        });
        return saved;
    }
    async findAllPaginated(page = 1, limit = 20, search) {
        const qb = this.membersRepository.createQueryBuilder('member');
        if (search === null || search === void 0 ? void 0 : search.trim()) {
            const pattern = `%${search.trim().toLowerCase()}%`;
            qb.where('LOWER(member.first_name) LIKE :pattern OR LOWER(member.last_name) LIKE :pattern OR LOWER(member.email) LIKE :pattern OR member.phone LIKE :pattern OR LOWER(member.address) LIKE :pattern', { pattern });
        }
        qb.orderBy('member.created_at', 'DESC');
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
            order: { created_at: 'DESC' },
        });
    }
    async findOne(id) {
        const member = await this.membersRepository.findOne({ where: { id } });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID ${id} not found`);
        }
        return member;
    }
    async update(id, updateMemberDto) {
        await this.membersRepository.update(id, updateMemberDto);
        const member = await this.findOne(id);
        const name = `${member.first_name} ${member.last_name}`.trim();
        this.events.emit(notification_events_1.NOTIFICATION_EVENT, {
            eventName: 'member.updated',
            kind: 'member',
            severity: 'info',
            title: 'Member updated',
            message: `${name}'s profile was updated.`,
            href: `/members/${id}`,
            dedupeKey: `member.updated:${id}:${Date.now()}`,
            targetRoles: ['admin', 'minister'],
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
                eventName: 'member.deleted',
                kind: 'member',
                severity: 'warning',
                title: 'Member removed',
                message: `${name} was removed from the directory.`,
                dedupeKey: `member.deleted:${id}`,
                targetRoles: ['admin', 'minister'],
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
