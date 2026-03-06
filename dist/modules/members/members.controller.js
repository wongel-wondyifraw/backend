"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const members_service_1 = require("./members.service");
const create_member_dto_1 = require("./dto/create-member.dto");
const update_member_dto_1 = require("./dto/update-member.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const ministries_service_1 = require("../ministries/ministries.service");
let MembersController = class MembersController {
    constructor(membersService, ministriesService) {
        this.membersService = membersService;
        this.ministriesService = ministriesService;
    }
    async create(createMemberDto, files) {
        var _a, _b;
        const memberId = (0, crypto_1.randomUUID)();
        let imageUrl = undefined;
        let documentUrl = undefined;
        // Process avatar file
        if ((_a = files === null || files === void 0 ? void 0 : files.avatar) === null || _a === void 0 ? void 0 : _a[0]) {
            const file = files.avatar[0];
            const fileExt = (0, path_1.extname)(file.originalname);
            const filename = `${memberId}${fileExt}`;
            const targetPath = (0, path_1.join)(process.cwd(), 'uploads/images', filename);
            try {
                if (fs.existsSync(file.path)) {
                    fs.copyFileSync(file.path, targetPath);
                    fs.unlinkSync(file.path);
                }
                imageUrl = `uploads/images/${filename}`;
            }
            catch (err) {
                console.error('Error processing member avatar:', err);
            }
        }
        // Process document (church letter) file
        if ((_b = files === null || files === void 0 ? void 0 : files.document) === null || _b === void 0 ? void 0 : _b[0]) {
            const file = files.document[0];
            const fileExt = (0, path_1.extname)(file.originalname);
            const filename = `${memberId}-letter${fileExt}`;
            const targetPath = (0, path_1.join)(process.cwd(), 'uploads/documents', filename);
            try {
                if (fs.existsSync(file.path)) {
                    fs.copyFileSync(file.path, targetPath);
                    fs.unlinkSync(file.path);
                }
                documentUrl = `uploads/documents/${filename}`;
            }
            catch (err) {
                console.error('Error processing member document:', err);
            }
        }
        return this.membersService.create({
            ...createMemberDto,
            image_url: imageUrl,
            document_url: documentUrl,
        }, memberId);
    }
    async findAll() {
        return this.membersService.findAll();
    }
    async findOne(id) {
        return this.membersService.findOne(id);
    }
    async update(id, updateMemberDto, files) {
        var _a, _b;
        // Process avatar file
        if ((_a = files === null || files === void 0 ? void 0 : files.avatar) === null || _a === void 0 ? void 0 : _a[0]) {
            const file = files.avatar[0];
            const fileExt = (0, path_1.extname)(file.originalname);
            const filename = `${id}${fileExt}`;
            const targetPath = (0, path_1.join)(process.cwd(), 'uploads/images', filename);
            try {
                if (fs.existsSync(file.path)) {
                    fs.copyFileSync(file.path, targetPath);
                    fs.unlinkSync(file.path);
                }
                updateMemberDto.image_url = `uploads/images/${filename}`;
            }
            catch (err) {
                console.error('Error processing member avatar:', err);
            }
        }
        // Process document (church letter) file
        if ((_b = files === null || files === void 0 ? void 0 : files.document) === null || _b === void 0 ? void 0 : _b[0]) {
            const file = files.document[0];
            const fileExt = (0, path_1.extname)(file.originalname);
            const filename = `${id}-letter${fileExt}`;
            const targetPath = (0, path_1.join)(process.cwd(), 'uploads/documents', filename);
            try {
                if (fs.existsSync(file.path)) {
                    fs.copyFileSync(file.path, targetPath);
                    fs.unlinkSync(file.path);
                }
                updateMemberDto.document_url = `uploads/documents/${filename}`;
            }
            catch (err) {
                console.error('Error processing member document:', err);
            }
        }
        return this.membersService.update(id, updateMemberDto);
    }
    async remove(id) {
        return this.membersService.remove(id);
    }
    async getMemberMinistries(id) {
        return this.ministriesService.getMemberMinistries(id);
    }
};
exports.MembersController = MembersController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'avatar', maxCount: 1 },
        { name: 'document', maxCount: 1 },
    ], {
        storage: (0, multer_1.diskStorage)({
            destination: (req, file, cb) => {
                const subfolder = file.fieldname === 'avatar' ? 'images' : 'documents';
                const uploadPath = (0, path_1.join)(process.cwd(), 'uploads', subfolder);
                if (!fs.existsSync(uploadPath)) {
                    fs.mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `temp-${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
    })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_member_dto_1.CreateMemberDto, Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'avatar', maxCount: 1 },
        { name: 'document', maxCount: 1 },
    ], {
        storage: (0, multer_1.diskStorage)({
            destination: (req, file, cb) => {
                const subfolder = file.fieldname === 'avatar' ? 'images' : 'documents';
                const uploadPath = (0, path_1.join)(process.cwd(), 'uploads', subfolder);
                if (!fs.existsSync(uploadPath)) {
                    fs.mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `temp-${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
    })),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_member_dto_1.UpdateMemberDto, Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/ministries'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "getMemberMinistries", null);
exports.MembersController = MembersController = __decorate([
    (0, common_1.Controller)('members'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [members_service_1.MembersService,
        ministries_service_1.MinistriesService])
], MembersController);
