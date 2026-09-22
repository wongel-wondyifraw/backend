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
const community_project_entity_1 = require("./entities/community-project.entity");
let WebsiteService = class WebsiteService {
    constructor(pageContentRepo, communityProjectRepo) {
        this.pageContentRepo = pageContentRepo;
        this.communityProjectRepo = communityProjectRepo;
    }
    // Page Content Methods
    async getPageContent(slug) {
        const page = await this.pageContentRepo.findOne({ where: { page_slug: slug } });
        if (!page) {
            // Return default empty content if not found
            return { page_slug: slug, content: {} };
        }
        return page;
    }
    async updatePageContent(slug, content) {
        let page = await this.pageContentRepo.findOne({ where: { page_slug: slug } });
        if (!page) {
            page = this.pageContentRepo.create({ page_slug: slug, content });
        }
        else {
            page.content = content;
        }
        return this.pageContentRepo.save(page);
    }
    // Community Project Methods
    async getProjects(status) {
        if (status) {
            return this.communityProjectRepo.find({ where: { status }, order: { created_at: 'DESC' } });
        }
        return this.communityProjectRepo.find({ order: { created_at: 'DESC' } });
    }
    async getProject(id) {
        const project = await this.communityProjectRepo.findOne({ where: { id } });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        return project;
    }
    async createProject(data) {
        const project = this.communityProjectRepo.create(data);
        return this.communityProjectRepo.save(project);
    }
    async updateProject(id, data) {
        await this.communityProjectRepo.update(id, data);
        return this.getProject(id);
    }
    async deleteProject(id) {
        const result = await this.communityProjectRepo.delete(id);
        if (result.affected === 0)
            throw new common_1.NotFoundException('Project not found');
    }
};
exports.WebsiteService = WebsiteService;
exports.WebsiteService = WebsiteService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(page_content_entity_1.PageContent)),
    __param(1, (0, typeorm_1.InjectRepository)(community_project_entity_1.CommunityProject)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], WebsiteService);
