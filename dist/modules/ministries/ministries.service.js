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
const ministry_entity_1 = require("./entities/ministry.entity");
const ministry_member_entity_1 = require("./entities/ministry-member.entity");
let MinistriesService = class MinistriesService {
    constructor(ministriesRepository, ministryMembersRepository) {
        this.ministriesRepository = ministriesRepository;
        this.ministryMembersRepository = ministryMembersRepository;
    }
    // ==================== Ministry CRUD ====================
    async create(createMinistryDto) {
        const ministry = this.ministriesRepository.create(createMinistryDto);
        return this.ministriesRepository.save(ministry);
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
        return this.findOne(id);
    }
    async remove(id) {
        const result = await this.ministriesRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Ministry with ID ${id} not found`);
        }
    }
    // ==================== Ministry Members ====================
    async addMember(ministryId, memberId) {
        // Check if already exists
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
        return this.ministryMembersRepository.save(record);
    }
    async removeMember(ministryId, memberId) {
        const result = await this.ministryMembersRepository.delete({
            ministry_id: ministryId,
            member_id: memberId,
        });
        if (result.affected === 0) {
            throw new common_1.NotFoundException('Member not found in this ministry');
        }
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
        typeorm_2.Repository])
], MinistriesService);
