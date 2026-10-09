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
exports.UploadsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const throttler_1 = require("@nestjs/throttler");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const multer_config_1 = require("../../common/config/multer.config");
const local_storage_service_1 = require("./local-storage.service");
let UploadsController = class UploadsController {
    constructor(storage) {
        this.storage = storage;
    }
    async uploadImage(file) {
        if (!file) {
            throw new common_1.BadRequestException("File not found");
        }
        const processed = await this.storage.uploadImage(file);
        return {
            message: "File uploaded successfully",
            url: processed.url,
            variants: processed.variants,
            width: processed.width,
            height: processed.height,
        };
    }
    async uploadDocument(file) {
        if (!file) {
            throw new common_1.BadRequestException("File not found");
        }
        const uploaded = this.storage.uploadDocument(file);
        return {
            message: "Document uploaded successfully",
            url: uploaded.url,
            original_name: uploaded.original_name,
        };
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Post)("image"),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, permissions_decorator_1.RequiresPermissions)("uploads.create", "website.manage", "members.update", "members.create"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file", {
        storage: (0, multer_config_1.createDefaultImageDiskStorage)(),
        fileFilter: multer_config_1.imageFileFilter,
        limits: multer_config_1.imageUploadLimits,
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadImage", null);
__decorate([
    (0, common_1.Post)("document"),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, permissions_decorator_1.RequiresPermissions)("uploads.create", "website.manage", "members.update", "members.create"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file", {
        storage: (0, multer_config_1.createDefaultDocumentDiskStorage)(),
        fileFilter: multer_config_1.documentFileFilter,
        limits: multer_config_1.documentUploadLimits,
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadDocument", null);
exports.UploadsController = UploadsController = __decorate([
    (0, common_1.Controller)("uploads"),
    __metadata("design:paramtypes", [local_storage_service_1.LocalStorageService])
], UploadsController);
