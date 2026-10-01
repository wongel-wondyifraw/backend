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
exports.ContactRequestsController = void 0;
const common_1 = require("@nestjs/common");
const contact_requests_service_1 = require("./contact-requests.service");
const create_contact_request_dto_1 = require("./dto/create-contact-request.dto");
const update_contact_request_dto_1 = require("./dto/update-contact-request.dto");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let ContactRequestsController = class ContactRequestsController {
    constructor(contactRequestsService) {
        this.contactRequestsService = contactRequestsService;
    }
    /**
     * Public endpoint to submit prayer requests, ministry inquiries, or general messages.
     */
    async submit(dto) {
        const created = await this.contactRequestsService.create(dto);
        return {
            success: true,
            message: "Thank you for reaching out. Your request has been received.",
            id: created.id,
        };
    }
    /**
     * Pastoral staff endpoint to view incoming requests.
     */
    async list(status) {
        return this.contactRequestsService.findAll(status);
    }
    async getOne(id) {
        return this.contactRequestsService.findOne(id);
    }
    async update(id, dto) {
        return this.contactRequestsService.update(id, dto);
    }
    async delete(id) {
        await this.contactRequestsService.delete(id);
        return { success: true };
    }
};
exports.ContactRequestsController = ContactRequestsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_contact_request_dto_1.CreateContactRequestDto]),
    __metadata("design:returntype", Promise)
], ContactRequestsController.prototype, "submit", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequiresPermissions)("website.manage"),
    __param(0, (0, common_1.Query)("status")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContactRequestsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, permissions_decorator_1.RequiresPermissions)("website.manage"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContactRequestsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, permissions_decorator_1.RequiresPermissions)("website.manage"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_contact_request_dto_1.UpdateContactRequestDto]),
    __metadata("design:returntype", Promise)
], ContactRequestsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, permissions_decorator_1.RequiresPermissions)("website.manage"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContactRequestsController.prototype, "delete", null);
exports.ContactRequestsController = ContactRequestsController = __decorate([
    (0, common_1.Controller)("website/contact-requests"),
    __metadata("design:paramtypes", [contact_requests_service_1.ContactRequestsService])
], ContactRequestsController);
