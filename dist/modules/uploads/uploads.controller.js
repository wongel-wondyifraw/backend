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
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const multer_config_1 = require("../../common/config/multer.config");
const image_processor_1 = require("./image-processor");
let UploadsController = class UploadsController {
    async uploadImage(file) {
        if (!file) {
            throw new common_1.BadRequestException('File not found');
        }
        const processed = await (0, image_processor_1.processUploadedImage)(file.path, file.filename);
        return {
            message: 'File uploaded successfully',
            url: processed.url,
            variants: processed.variants,
            width: processed.width,
            height: processed.height,
        };
    }
    uploadDocument(file) {
        if (!file) {
            throw new common_1.BadRequestException('File not found');
        }
        return {
            message: 'Document uploaded successfully',
            url: `uploads/documents/${file.filename}`,
            original_name: file.originalname,
        };
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Post)('image'),
    (0, permissions_decorator_1.RequiresPermissions)('uploads.create', 'website.manage', 'members.update', 'members.create'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_config_1.createImageDiskStorage)((_req, file, cb) => {
            cb(null, (0, multer_config_1.uploadImageFilename)(file.originalname));
        }),
        fileFilter: multer_config_1.imageFileFilter,
        limits: multer_config_1.imageUploadLimits,
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadImage", null);
__decorate([
    (0, common_1.Post)('document'),
    (0, permissions_decorator_1.RequiresPermissions)('uploads.create', 'website.manage', 'members.update', 'members.create'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_config_1.createDocumentDiskStorage)((_req, file, cb) => {
            cb(null, (0, multer_config_1.uploadDocumentFilename)(file.originalname));
        }),
        fileFilter: multer_config_1.documentFileFilter,
        limits: multer_config_1.documentUploadLimits,
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UploadsController.prototype, "uploadDocument", null);
exports.UploadsController = UploadsController = __decorate([
    (0, common_1.Controller)('uploads')
], UploadsController);
