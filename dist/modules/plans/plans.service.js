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
exports.PlansService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const plan_entity_1 = require("./entities/plan.entity");
const plan_minister_entity_1 = require("./entities/plan-minister.entity");
const minister_entity_1 = require("../ministers/entities/minister.entity");
const ethiopian_calendar_1 = require("../../common/utils/ethiopian-calendar");
const calendar_dto_helper_1 = require("../../common/utils/calendar-dto.helper");
const name_normalizer_1 = require("../../common/utils/name-normalizer");
let PlansService = class PlansService {
    constructor(plansRepository, planMinistersRepository, ministersRepository) {
        this.plansRepository = plansRepository;
        this.planMinistersRepository = planMinistersRepository;
        this.ministersRepository = ministersRepository;
        this.relations = {
            plan_ministers: { minister: true },
        };
    }
    async assertMinistersExist(ids) {
        if (!ids.length)
            return;
        const found = await this.ministersRepository.find({
            where: { id: (0, typeorm_2.In)(ids) },
            select: ["id"],
        });
        if (found.length !== ids.length) {
            throw new common_1.BadRequestException("One or more ministers were not found");
        }
    }
    async replaceMinisters(planId, ministerIds) {
        await this.planMinistersRepository.delete({ plan_id: planId });
        if (!ministerIds.length)
            return;
        const rows = ministerIds.map((minister_id) => this.planMinistersRepository.create({ plan_id: planId, minister_id }));
        await this.planMinistersRepository.save(rows);
    }
    async create(dto) {
        var _a, _b;
        const ministerIds = (_a = dto.minister_ids) !== null && _a !== void 0 ? _a : [];
        await this.assertMinistersExist(ministerIds);
        if (dto.start_time && dto.end_time && dto.end_time < dto.start_time) {
            throw new common_1.BadRequestException("end_time must be after start_time");
        }
        const resolvedDate = (0, calendar_dto_helper_1.resolveDateFieldForWrite)("plan_date", dto.plan_date, {
            calendar: dto.plan_date_calendar,
            allowPartial: false,
        });
        if (!(resolvedDate === null || resolvedDate === void 0 ? void 0 : resolvedDate.value)) {
            throw new common_1.BadRequestException("plan_date is required");
        }
        const plan = this.plansRepository.create({
            title: (0, name_normalizer_1.normalizeTitleInitials)(dto.title),
            type: dto.type,
            plan_date: resolvedDate.value,
            plan_date_calendar: resolvedDate.calendar,
            start_time: dto.start_time || null,
            end_time: dto.end_time || null,
            location: dto.location ? (0, name_normalizer_1.normalizeTitleInitials)(dto.location) || null : null,
            notes: ((_b = dto.notes) === null || _b === void 0 ? void 0 : _b.trim()) || null,
            status: dto.status || "planned",
        });
        const saved = await this.plansRepository.save(plan);
        await this.replaceMinisters(saved.id, ministerIds);
        return this.findOne(saved.id);
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
                const message = err instanceof Error ? err.message : "Failed to create plan";
                errors.push({ index: i, message });
            }
        }
        return { created, failed: errors.length, errors };
    }
    async findAllPaginated(page = 1, limit = 20, search, filters) {
        var _a, _b;
        const qb = this.plansRepository
            .createQueryBuilder("plan")
            .leftJoinAndSelect("plan.plan_ministers", "pm")
            .leftJoinAndSelect("pm.minister", "minister");
        if (search === null || search === void 0 ? void 0 : search.trim()) {
            const pattern = `%${search.trim().toLowerCase()}%`;
            qb.andWhere("(LOWER(plan.title) LIKE :pattern OR LOWER(COALESCE(plan.location, '')) LIKE :pattern OR LOWER(COALESCE(plan.notes, '')) LIKE :pattern)", { pattern });
        }
        if (filters === null || filters === void 0 ? void 0 : filters.type) {
            qb.andWhere("plan.type = :type", { type: filters.type });
        }
        if (filters === null || filters === void 0 ? void 0 : filters.status) {
            qb.andWhere("plan.status = :status", { status: filters.status });
        }
        if (filters === null || filters === void 0 ? void 0 : filters.from) {
            const boundFrom = (_a = (0, ethiopian_calendar_1.resolveFilterDateBound)(filters.from, "start", filters.calendar)) !== null && _a !== void 0 ? _a : filters.from;
            qb.andWhere("plan.plan_date >= :from", { from: boundFrom });
        }
        if (filters === null || filters === void 0 ? void 0 : filters.to) {
            const boundTo = (_b = (0, ethiopian_calendar_1.resolveFilterDateBound)(filters.to, "end", filters.calendar)) !== null && _b !== void 0 ? _b : filters.to;
            qb.andWhere("plan.plan_date <= :to", { to: boundTo });
        }
        qb.orderBy("plan.plan_date", "ASC")
            .addOrderBy("plan.start_time", "ASC", "NULLS LAST")
            .skip((page - 1) * limit)
            .take(limit);
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
        const plan = await this.plansRepository.findOne({
            where: { id },
            relations: this.relations,
        });
        if (!plan)
            throw new common_1.NotFoundException("Plan not found");
        return plan;
    }
    async update(id, dto) {
        var _a;
        const plan = await this.findOne(id);
        if (dto.title !== undefined)
            plan.title = (0, name_normalizer_1.normalizeTitleInitials)(dto.title);
        if (dto.type !== undefined)
            plan.type = dto.type;
        if (dto.plan_date !== undefined) {
            const resolvedDate = (0, calendar_dto_helper_1.resolveDateFieldForWrite)("plan_date", dto.plan_date, {
                calendar: dto.plan_date_calendar,
                allowPartial: false,
            });
            if (!(resolvedDate === null || resolvedDate === void 0 ? void 0 : resolvedDate.value)) {
                throw new common_1.BadRequestException("plan_date cannot be empty");
            }
            plan.plan_date = resolvedDate.value;
            plan.plan_date_calendar = resolvedDate.calendar;
        }
        else if (dto.plan_date_calendar !== undefined) {
            plan.plan_date_calendar = dto.plan_date_calendar;
        }
        if (dto.start_time !== undefined)
            plan.start_time = dto.start_time || null;
        if (dto.end_time !== undefined)
            plan.end_time = dto.end_time || null;
        if (dto.location !== undefined)
            plan.location = dto.location ? (0, name_normalizer_1.normalizeTitleInitials)(dto.location) || null : null;
        if (dto.notes !== undefined)
            plan.notes = ((_a = dto.notes) === null || _a === void 0 ? void 0 : _a.trim()) || null;
        if (dto.status !== undefined)
            plan.status = dto.status;
        const start = dto.start_time !== undefined ? plan.start_time : plan.start_time;
        const end = dto.end_time !== undefined ? plan.end_time : plan.end_time;
        if (start && end && end < start) {
            throw new common_1.BadRequestException("end_time must be after start_time");
        }
        await this.plansRepository.save(plan);
        if (dto.minister_ids !== undefined) {
            await this.assertMinistersExist(dto.minister_ids);
            await this.replaceMinisters(id, dto.minister_ids);
        }
        return this.findOne(id);
    }
    async remove(id) {
        const plan = await this.plansRepository.findOne({ where: { id } });
        if (!plan)
            throw new common_1.NotFoundException("Plan not found");
        await this.plansRepository.delete(id);
    }
};
exports.PlansService = PlansService;
exports.PlansService = PlansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(plan_entity_1.Plan)),
    __param(1, (0, typeorm_1.InjectRepository)(plan_minister_entity_1.PlanMinister)),
    __param(2, (0, typeorm_1.InjectRepository)(minister_entity_1.Minister)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PlansService);
