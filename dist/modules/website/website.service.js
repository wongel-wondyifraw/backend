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
exports.WebsiteService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const page_content_entity_1 = require("./entities/page-content.entity");
const PAGE_CACHE_TTL_MS = 60000;
let WebsiteService = class WebsiteService {
    constructor(pageContentRepo) {
        this.pageContentRepo = pageContentRepo;
        this.pageCache = new Map();
    }
    async getPageContent(slug) {
        const cached = this.pageCache.get(slug);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.value;
        }
        const page = await this.pageContentRepo.findOne({
            where: { page_slug: slug },
        });
        const value = page
            ? {
                page_slug: page.page_slug,
                content: page.content,
                created_at: page.created_at,
                updated_at: page.updated_at,
            }
            : { page_slug: slug, content: slug === "landing" ? {} : "" };
        this.pageCache.set(slug, {
            value,
            expiresAt: Date.now() + PAGE_CACHE_TTL_MS,
        });
        return value;
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
        let page = await this.pageContentRepo.findOne({
            where: { page_slug: slug },
        });
        const content = typeof payload === "string"
            ? payload
            : payload && typeof payload === "object" && !Array.isArray(payload)
                ? payload
                : {};
        if (!page) {
            page = this.pageContentRepo.create({ page_slug: slug, content });
        }
        else {
            page.content = content;
        }
        const saved = await this.pageContentRepo.save(page);
        this.pageCache.delete(slug);
        return saved;
    }
};
exports.WebsiteService = WebsiteService;
exports.WebsiteService = WebsiteService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(page_content_entity_1.PageContent)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], WebsiteService);
