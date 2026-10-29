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
var ContactRequestsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactRequestsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const contact_request_entity_1 = require("./entities/contact-request.entity");
const notification_events_1 = require("../notifications/notification-events");
let ContactRequestsService = ContactRequestsService_1 = class ContactRequestsService {
    constructor(contactRepo, eventEmitter) {
        this.contactRepo = contactRepo;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(ContactRequestsService_1.name);
    }
    async create(dto) {
        const record = this.contactRepo.create({
            full_name: dto.full_name.trim(),
            phone: dto.phone.trim(),
            email: dto.email ? dto.email.trim().toLowerCase() : null,
            category: dto.category || "general",
            message: dto.message.trim(),
            is_confidential: Boolean(dto.is_confidential),
            status: "new",
        });
        const saved = await this.contactRepo.save(record);
        try {
            const isConfidential = saved.is_confidential;
            const snippet = saved.message.length > 80
                ? `${saved.message.slice(0, 80)}...`
                : saved.message;
            const title = isConfidential
                ? "Confidential Prayer Request"
                : `New Inquiry (${saved.category.toUpperCase()})`;
            const eventPayload = {
                eventName: "contact_request.created",
                kind: "system",
                severity: isConfidential ? "warning" : "info",
                title,
                message: `${saved.full_name} (${saved.phone}): "${snippet}"`,
                href: "/dashboard?tab=requests",
                targetRoles: isConfidential ? ["admin"] : ["admin", "minister"],
                includeAdmins: true,
                payload: {
                    requestId: saved.id,
                    category: saved.category,
                    isConfidential,
                },
            };
            this.eventEmitter.emit(notification_events_1.NOTIFICATION_EVENT, eventPayload);
        }
        catch (err) {
            this.logger.warn(`Failed to emit notification event for contact request: ${String(err)}`);
        }
        return saved;
    }
    async findAll(status, isAdmin = false) {
        const query = this.contactRepo.createQueryBuilder("cr");
        if (status) {
            query.where("cr.status = :status", { status });
        }
        if (!isAdmin) {
            query.andWhere("cr.is_confidential = false");
        }
        query.orderBy("cr.created_at", "DESC");
        return query.getMany();
    }
    async findOne(id, isAdmin = false) {
        const found = await this.contactRepo.findOne({ where: { id } });
        if (!found) {
            throw new common_1.NotFoundException(`Contact request with id ${id} not found`);
        }
        if (found.is_confidential && !isAdmin) {
            throw new common_1.NotFoundException(`Contact request with id ${id} not found`);
        }
        return found;
    }
    async update(id, dto, isAdmin = false) {
        const existing = await this.findOne(id, isAdmin);
        if (dto.status !== undefined)
            existing.status = dto.status;
        if (dto.assigned_to !== undefined)
            existing.assigned_to = dto.assigned_to;
        if (dto.notes !== undefined)
            existing.notes = dto.notes;
        if (dto.responded_at !== undefined) {
            existing.responded_at = dto.responded_at
                ? new Date(dto.responded_at)
                : null;
        }
        return this.contactRepo.save(existing);
    }
    async delete(id) {
        const found = await this.contactRepo.findOne({ where: { id } });
        if (!found) {
            throw new common_1.NotFoundException(`Contact request with id ${id} not found`);
        }
        await this.contactRepo.remove(found);
    }
};
exports.ContactRequestsService = ContactRequestsService;
exports.ContactRequestsService = ContactRequestsService = ContactRequestsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(contact_request_entity_1.ContactRequest)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], ContactRequestsService);
