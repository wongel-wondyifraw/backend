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
exports.TasksService = exports.HOME_VISIT_CODE = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const task_definition_entity_1 = require("./entities/task-definition.entity");
const task_entity_1 = require("./entities/task.entity");
const member_entity_1 = require("../members/entities/member.entity");
const minister_entity_1 = require("../ministers/entities/minister.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../notifications/entities/notification.entity");
exports.HOME_VISIT_CODE = 'HOME_VISIT';
let TasksService = class TasksService {
    constructor(definitions, tasks, ministers, members, notifications) {
        this.definitions = definitions;
        this.tasks = tasks;
        this.ministers = ministers;
        this.members = members;
        this.notifications = notifications;
        // --- Tasks ---
        this.taskRelations = {
            definition: true,
            minister: true,
            target_member: true,
            assigned_by: true,
        };
    }
    async onModuleInit() {
        await this.ensureHomeVisitDefinition();
    }
    async ensureHomeVisitDefinition() {
        const existing = await this.definitions.findOne({ where: { code: exports.HOME_VISIT_CODE } });
        if (existing)
            return;
        await this.definitions.save(this.definitions.create({
            name: 'Home Visit',
            description: 'Visit a church member at their home. Requires selecting who to visit.',
            code: exports.HOME_VISIT_CODE,
            requires_visit_target: true,
            is_system: true,
            is_active: true,
        }));
    }
    // --- Definitions ---
    async listDefinitions(activeOnly = false) {
        const where = activeOnly ? { is_active: true } : {};
        return this.definitions.find({ where, order: { is_system: 'DESC', name: 'ASC' } });
    }
    async createDefinition(dto) {
        var _a, _b, _c;
        const def = this.definitions.create({
            name: dto.name.trim(),
            description: ((_a = dto.description) === null || _a === void 0 ? void 0 : _a.trim()) || null,
            requires_visit_target: (_b = dto.requires_visit_target) !== null && _b !== void 0 ? _b : false,
            is_active: (_c = dto.is_active) !== null && _c !== void 0 ? _c : true,
            is_system: false,
            code: null,
        });
        return this.definitions.save(def);
    }
    async updateDefinition(id, dto) {
        var _a;
        const def = await this.definitions.findOne({ where: { id } });
        if (!def)
            throw new common_1.NotFoundException('Task definition not found');
        if (def.is_system && dto.requires_visit_target === false) {
            throw new common_1.BadRequestException('Home Visit must require a visit target');
        }
        if (dto.name !== undefined)
            def.name = dto.name.trim();
        if (dto.description !== undefined)
            def.description = ((_a = dto.description) === null || _a === void 0 ? void 0 : _a.trim()) || null;
        if (dto.requires_visit_target !== undefined && !def.is_system) {
            def.requires_visit_target = dto.requires_visit_target;
        }
        if (dto.is_active !== undefined)
            def.is_active = dto.is_active;
        return this.definitions.save(def);
    }
    async removeDefinition(id) {
        const def = await this.definitions.findOne({ where: { id } });
        if (!def)
            throw new common_1.NotFoundException('Task definition not found');
        if (def.is_system) {
            throw new common_1.BadRequestException('System task definitions cannot be deleted');
        }
        const inUse = await this.tasks.count({ where: { definition_id: id } });
        if (inUse > 0) {
            throw new common_1.BadRequestException('Cannot delete a definition that has assigned tasks. Deactivate it instead.');
        }
        await this.definitions.delete(id);
    }
    async createTask(dto, assignedByUserId) {
        var _a;
        const definition = await this.definitions.findOne({ where: { id: dto.definition_id } });
        if (!definition || !definition.is_active) {
            throw new common_1.BadRequestException('Task definition not found or inactive');
        }
        if (new Date(dto.end_date) < new Date(dto.start_date)) {
            throw new common_1.BadRequestException('End date must be on or after start date');
        }
        if (definition.requires_visit_target && !dto.target_member_id) {
            throw new common_1.BadRequestException('This task requires selecting who to visit');
        }
        const minister = await this.ministers.findOne({ where: { id: dto.minister_id } });
        if (!minister)
            throw new common_1.BadRequestException('Minister not found');
        const task = this.tasks.create({
            definition_id: dto.definition_id,
            minister_id: dto.minister_id,
            assigned_by_user_id: assignedByUserId,
            start_date: dto.start_date,
            end_date: dto.end_date,
            target_member_id: definition.requires_visit_target ? dto.target_member_id : null,
            notes: ((_a = dto.notes) === null || _a === void 0 ? void 0 : _a.trim()) || null,
            status: 'pending',
            visitation_methods: dto.visitation_methods || [],
        });
        const saved = await this.tasks.save(task);
        if (minister.user_id) {
            await this.notifications.create({
                userId: minister.user_id,
                kind: notification_entity_1.NotificationKind.SYSTEM,
                severity: notification_entity_1.NotificationSeverity.INFO,
                title: 'New task assigned',
                message: `${definition.name} was assigned to you (${dto.start_date} → ${dto.end_date}).`,
                href: '/dashboard',
                dedupeKey: `task.assigned:${saved.id}`,
            });
        }
        return this.findOne(saved.id);
    }
    async findAll(query) {
        var _a, _b, _c, _d;
        const page = (_a = query.page) !== null && _a !== void 0 ? _a : 1;
        const limit = (_b = query.limit) !== null && _b !== void 0 ? _b : 20;
        const qb = this.tasks
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.definition', 'definition')
            .leftJoinAndSelect('task.minister', 'minister')
            .leftJoinAndSelect('task.target_member', 'target_member')
            .leftJoinAndSelect('task.assigned_by', 'assigned_by');
        if (query.minister_id) {
            qb.andWhere('task.minister_id = :ministerId', { ministerId: query.minister_id });
        }
        if (query.definition_id) {
            qb.andWhere('task.definition_id = :definitionId', { definitionId: query.definition_id });
        }
        const status = (_c = query.status) !== null && _c !== void 0 ? _c : 'all';
        const today = new Date().toISOString().slice(0, 10);
        if (status === 'pending') {
            qb.andWhere('task.status = :s', { s: 'pending' });
        }
        else if (status === 'completed') {
            qb.andWhere('task.status = :s', { s: 'completed' });
        }
        else if (status === 'cancelled') {
            qb.andWhere('task.status = :s', { s: 'cancelled' });
        }
        else if (status === 'overdue') {
            qb.andWhere('task.status = :s AND task.end_date < :today', { s: 'pending', today });
        }
        if ((_d = query.search) === null || _d === void 0 ? void 0 : _d.trim()) {
            const pattern = `%${query.search.trim().toLowerCase()}%`;
            qb.andWhere(`(LOWER(definition.name) LIKE :pattern OR LOWER(minister.first_name) LIKE :pattern OR LOWER(minister.last_name) LIKE :pattern OR LOWER(COALESCE(target_member.first_name, '')) LIKE :pattern)`, { pattern });
        }
        qb.orderBy('task.created_at', 'DESC');
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
        const task = await this.tasks.findOne({
            where: { id },
            relations: this.taskRelations,
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        return task;
    }
    async findMine(userId, status) {
        const minister = await this.ministers.findOne({ where: { user_id: userId } });
        if (!minister)
            return [];
        const qb = this.tasks
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.definition', 'definition')
            .leftJoinAndSelect('task.target_member', 'target_member')
            .leftJoinAndSelect('task.minister', 'minister')
            .where('task.minister_id = :ministerId', { ministerId: minister.id });
        if (status === 'completed') {
            qb.andWhere('task.status = :s', { s: 'completed' });
        }
        else if (status === 'all') {
            qb.andWhere('task.status IN (:...statuses)', { statuses: ['pending', 'completed'] });
        }
        else {
            qb.andWhere('task.status = :s', { s: 'pending' });
        }
        qb.orderBy(`CASE WHEN task.status = 'pending' THEN 0 ELSE 1 END`, 'ASC')
            .addOrderBy('task.end_date', 'ASC');
        return qb.getMany();
    }
    async complete(id, userId, isAdmin) {
        const task = await this.findOne(id);
        if (task.status === 'completed')
            return task;
        const minister = await this.ministers.findOne({ where: { user_id: userId } });
        const isAssignee = !!minister && minister.id === task.minister_id;
        if (!isAdmin && !isAssignee) {
            throw new common_1.ForbiddenException('You can only complete tasks assigned to you');
        }
        task.status = 'completed';
        task.completed_at = new Date();
        await this.tasks.save(task);
        if (task.target_member_id) {
            await this.members.increment({ id: task.target_member_id }, 'visit_count', 1);
        }
        return this.findOne(id);
    }
    async update(id, dto) {
        var _a;
        const task = await this.findOne(id);
        if (dto.minister_id !== undefined)
            task.minister_id = dto.minister_id;
        if (dto.start_date !== undefined)
            task.start_date = dto.start_date;
        if (dto.end_date !== undefined)
            task.end_date = dto.end_date;
        if (dto.notes !== undefined)
            task.notes = ((_a = dto.notes) === null || _a === void 0 ? void 0 : _a.trim()) || null;
        if (dto.target_member_id !== undefined)
            task.target_member_id = dto.target_member_id;
        if (dto.visitation_methods !== undefined)
            task.visitation_methods = dto.visitation_methods;
        let justCompleted = false;
        if (dto.status !== undefined && task.status !== dto.status) {
            if (dto.status === 'completed')
                justCompleted = true;
            task.status = dto.status;
            task.completed_at = dto.status === 'completed' ? new Date() : null;
        }
        if (new Date(task.end_date) < new Date(task.start_date)) {
            throw new common_1.BadRequestException('End date must be on or after start date');
        }
        if (task.definition.requires_visit_target && !task.target_member_id) {
            throw new common_1.BadRequestException('This task requires selecting who to visit');
        }
        await this.tasks.save(task);
        return this.findOne(id);
    }
    async remove(id) {
        const result = await this.tasks.delete(id);
        if (result.affected === 0)
            throw new common_1.NotFoundException('Task not found');
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_definition_entity_1.TaskDefinition)),
    __param(1, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(2, (0, typeorm_1.InjectRepository)(minister_entity_1.Minister)),
    __param(3, (0, typeorm_1.InjectRepository)(member_entity_1.Member)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], TasksService);
