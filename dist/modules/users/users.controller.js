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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const crypto_1 = require("crypto");
const users_service_1 = require("./users.service");
const nestjs_pino_1 = require("nestjs-pino");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const multer_config_1 = require("../../common/config/multer.config");
const cloudinary_service_1 = require("../uploads/cloudinary.service");
let UsersController = class UsersController {
    constructor(usersService, logger, cloudinary) {
        this.usersService = usersService;
        this.logger = logger;
        this.cloudinary = cloudinary;
        this.logger.setContext("UsersController");
    }
    async findAll() {
        return this.usersService.findAll();
    }
    async getProfile(req) {
        return this.usersService.findOne(req.user.id, true);
    }
    async updateProfile(req, updateProfileDto) {
        return this.usersService.update(req.user.id, updateProfileDto);
    }
    async changePassword(req, changePasswordDto) {
        return this.usersService.changePassword(req.user.id, changePasswordDto);
    }
    async findOne(id) {
        return this.usersService.findOne(id, true);
    }
    async update(id, updateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }
    async create(createUserDto, file) {
        const userId = (0, crypto_1.randomUUID)();
        let avatarUrl = null;
        if (file) {
            try {
                const processed = await this.cloudinary.uploadImage(file, `cms/avatars/${userId}`);
                avatarUrl = processed.url;
            }
            catch (err) {
                this.logger.error({ err }, "Error processing avatar during creation");
            }
        }
        return this.usersService.create({
            ...createUserDto,
            id: userId,
            avatar_url: avatarUrl,
            created_at: new Date(),
        });
    }
    async remove(id) {
        return this.usersService.remove(id);
    }
    async uploadAvatar(id, file) {
        try {
            if (!file) {
                throw new common_1.NotFoundException("File not found");
            }
            const processed = await this.cloudinary.uploadImage(file, `cms/avatars/${id}`);
            await this.usersService.updateAvatar(id, processed.url);
            return {
                message: "Avatar uploaded successfully",
                avatar_url: processed.url,
            };
        }
        catch (error) {
            const err = error;
            this.logger.error({
                userId: id,
                fileMetadata: file
                    ? {
                        originalname: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size,
                    }
                    : null,
                errorMessage: err.message,
            }, "Failed to upload avatar");
            throw error;
        }
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequiresPermissions)("users.read"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("profile"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)("profile"),
    (0, permissions_decorator_1.RequiresPermissions)("settings.update"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Patch)("change-password"),
    (0, permissions_decorator_1.RequiresPermissions)("settings.update"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, permissions_decorator_1.RequiresPermissions)("users.read"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, permissions_decorator_1.RequiresPermissions)("users.manage"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequiresPermissions)("users.manage"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("avatar", {
        storage: (0, multer_config_1.createImageMemoryStorage)(),
        fileFilter: multer_config_1.imageFileFilter,
        limits: multer_config_1.imageUploadLimits,
    })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, permissions_decorator_1.RequiresPermissions)("users.manage"),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(":id/upload-avatar"),
    (0, permissions_decorator_1.RequiresPermissions)("settings.update", "users.manage"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file", {
        storage: (0, multer_config_1.createImageMemoryStorage)(),
        fileFilter: multer_config_1.imageFileFilter,
        limits: multer_config_1.imageUploadLimits,
    })),
    __param(0, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "uploadAvatar", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)("users"),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        nestjs_pino_1.PinoLogger,
        cloudinary_service_1.CloudinaryService])
], UsersController);
