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
exports.WebsiteController = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const website_service_1 = require("./website.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const landing_page_content_dto_1 = require("./dto/landing-page-content.dto");
function flattenValidationErrors(errors, prefix = "") {
    var _a;
    const out = [];
    for (const error of errors) {
        const path = prefix ? `${prefix}.${error.property}` : error.property;
        if (error.constraints) {
            for (const message of Object.values(error.constraints)) {
                out.push(`${path}: ${message}`);
            }
        }
        if ((_a = error.children) === null || _a === void 0 ? void 0 : _a.length) {
            out.push(...flattenValidationErrors(error.children, path));
        }
    }
    return out;
}
let WebsiteController = class WebsiteController {
    constructor(websiteService) {
        this.websiteService = websiteService;
    }
    getPageContent(slug) {
        return this.websiteService.getPageContent(slug);
    }
    async updatePageContent(slug, body) {
        let payload = body;
        if (body &&
            typeof body === "object" &&
            !Array.isArray(body) &&
            Object.prototype.hasOwnProperty.call(body, "content") &&
            Object.keys(body).every((k) => k === "content")) {
            payload = body.content;
        }
        if (slug === "landing") {
            payload = await this.sanitizeLandingContent(payload);
        }
        return this.websiteService.updatePageContent(slug, payload);
    }
    /**
     * Landing CMS JSON often carries legacy nested keys from older seeds.
     * Whitelist/strip unknowns instead of failing with a opaque 400, and
     * persist the cleaned shape so the next save stays clean.
     */
    async sanitizeLandingContent(payload) {
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
            throw new common_1.BadRequestException("Landing content must be an object");
        }
        const raw = payload;
        const pruned = {};
        for (const key of landing_page_content_dto_1.LANDING_CONTENT_KEYS) {
            if (Object.prototype.hasOwnProperty.call(raw, key)) {
                pruned[key] = raw[key];
            }
        }
        const dto = (0, class_transformer_1.plainToInstance)(landing_page_content_dto_1.LandingPageContentDto, pruned, {
            enableImplicitConversion: true,
            exposeUnsetFields: false,
        });
        // Strip unknown nested fields; only fail on real type errors.
        const errors = await (0, class_validator_1.validate)(dto, {
            whitelist: true,
            forbidNonWhitelisted: false,
        });
        if (errors.length) {
            const messages = flattenValidationErrors(errors);
            throw new common_1.BadRequestException(messages.length ? messages.join("; ") : "Invalid landing content");
        }
        const plain = (0, class_transformer_1.instanceToPlain)(dto);
        // class-transformer whitelist can drop nested card fields (text, icon).
        // Restore item arrays from the request so vision/program cards persist.
        for (const key of landing_page_content_dto_1.LANDING_CONTENT_KEYS) {
            const incoming = raw[key];
            const outgoing = plain[key];
            if (incoming &&
                typeof incoming === "object" &&
                !Array.isArray(incoming) &&
                Array.isArray(incoming.items) &&
                outgoing &&
                typeof outgoing === "object" &&
                !Array.isArray(outgoing)) {
                outgoing.items = incoming.items;
            }
        }
        return plain;
    }
};
exports.WebsiteController = WebsiteController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("pages/:slug"),
    __param(0, (0, common_1.Param)("slug")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WebsiteController.prototype, "getPageContent", null);
__decorate([
    (0, common_1.Patch)("pages/:slug"),
    (0, permissions_decorator_1.RequiresPermissions)("website.manage"),
    __param(0, (0, common_1.Param)("slug")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebsiteController.prototype, "updatePageContent", null);
exports.WebsiteController = WebsiteController = __decorate([
    (0, common_1.Controller)("website"),
    __metadata("design:paramtypes", [website_service_1.WebsiteService])
], WebsiteController);
