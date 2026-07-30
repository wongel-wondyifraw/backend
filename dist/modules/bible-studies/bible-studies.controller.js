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
exports.BibleStudiesController = void 0;
const common_1 = require("@nestjs/common");
const bible_studies_service_1 = require("./bible-studies.service");
const create_bible_study_dto_1 = require("./dto/create-bible-study.dto");
const update_bible_study_dto_1 = require("./dto/update-bible-study.dto");
const pagination_query_dto_1 = require("../../common/dto/pagination-query.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let BibleStudiesController = class BibleStudiesController {
    constructor(bibleStudiesService) {
        this.bibleStudiesService = bibleStudiesService;
    }
    create(dto) {
        return this.bibleStudiesService.create(dto);
    }
    findAll(query) {
        return this.bibleStudiesService.findAllPaginated(query.page, query.limit, query.search);
    }
    findOne(id) {
        return this.bibleStudiesService.findOne(id);
    }
    update(id, dto) {
        return this.bibleStudiesService.update(id, dto);
    }
    remove(id) {
        return this.bibleStudiesService.remove(id);
    }
    getMembers(id) {
        return this.bibleStudiesService.getMembers(id);
    }
    addMember(id, memberId) {
        return this.bibleStudiesService.addMember(id, memberId);
    }
    removeMember(id, memberId) {
        return this.bibleStudiesService.removeMember(id, memberId);
    }
};
exports.BibleStudiesController = BibleStudiesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequiresPermissions)('bible_studies.create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_bible_study_dto_1.CreateBibleStudyDto]),
    __metadata("design:returntype", void 0)
], BibleStudiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequiresPermissions)('bible_studies.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], BibleStudiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequiresPermissions)('bible_studies.read'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BibleStudiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.RequiresPermissions)('bible_studies.update'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_bible_study_dto_1.UpdateBibleStudyDto]),
    __metadata("design:returntype", void 0)
], BibleStudiesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequiresPermissions)('bible_studies.delete'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BibleStudiesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    (0, permissions_decorator_1.RequiresPermissions)('bible_studies.read'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BibleStudiesController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Post)(':id/members/:memberId'),
    (0, permissions_decorator_1.RequiresPermissions)('bible_studies.update'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('memberId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BibleStudiesController.prototype, "addMember", null);
__decorate([
    (0, common_1.Delete)(':id/members/:memberId'),
    (0, permissions_decorator_1.RequiresPermissions)('bible_studies.update'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('memberId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BibleStudiesController.prototype, "removeMember", null);
exports.BibleStudiesController = BibleStudiesController = __decorate([
    (0, common_1.Controller)('bible-studies'),
    __metadata("design:paramtypes", [bible_studies_service_1.BibleStudiesService])
], BibleStudiesController);
