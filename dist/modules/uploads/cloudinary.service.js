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
var CloudinaryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cloudinary_1 = require("cloudinary");
const fs_1 = require("fs");
const path_1 = require("path");
const multer_config_1 = require("../../common/config/multer.config");
let CloudinaryService = CloudinaryService_1 = class CloudinaryService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(CloudinaryService_1.name);
        this.cloudRequested = this.config.get('CLOUD_STORAGE') === 'true';
        const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME');
        const apiKey = this.config.get('CLOUDINARY_API_KEY');
        const apiSecret = this.config.get('CLOUDINARY_API_SECRET');
        const hasCredentials = Boolean(cloudName && apiKey && apiSecret);
        this.enabled = this.cloudRequested && hasCredentials;
        if (this.cloudRequested && !hasCredentials) {
            this.logger.error('CLOUD_STORAGE=true but CLOUDINARY_* credentials are missing');
        }
        if (this.enabled) {
            cloudinary_1.v2.config({
                cloud_name: cloudName,
                api_key: apiKey,
                api_secret: apiSecret,
                secure: true,
            });
            this.logger.log('Cloud storage enabled (Cloudinary)');
        }
        else if (!this.cloudRequested) {
            this.logger.log('Cloud storage disabled — using local uploads/');
        }
    }
    isEnabled() {
        return this.enabled;
    }
    async uploadImage(file, folder = 'cms/images') {
        this.assertCloudReady();
        if (this.enabled) {
            return this.uploadImageToCloudinary(file, folder);
        }
        return this.uploadImageLocally(file);
    }
    async uploadDocument(file, folder = 'cms/documents') {
        this.assertCloudReady();
        if (this.enabled) {
            return this.uploadDocumentToCloudinary(file, folder);
        }
        return this.uploadDocumentLocally(file);
    }
    assertCloudReady() {
        if (this.cloudRequested && !this.enabled) {
            throw new common_1.ServiceUnavailableException('CLOUD_STORAGE=true but Cloudinary credentials are not configured');
        }
    }
    async uploadImageToCloudinary(file, folder) {
        var _a, _b, _c, _d;
        // No local transform — Cloudinary handles resize/webp via eager transforms.
        const result = await this.uploadBuffer(file, {
            folder,
            resource_type: 'image',
            eager: [
                {
                    width: 800,
                    height: 800,
                    crop: 'limit',
                    quality: 78,
                    fetch_format: 'webp',
                },
                {
                    width: 320,
                    height: 320,
                    crop: 'fill',
                    gravity: 'auto',
                    quality: 72,
                    fetch_format: 'webp',
                },
            ],
            // Async eager avoids holding the upload connection while variants build
            eager_async: true,
            transformation: [
                {
                    width: 1920,
                    height: 1920,
                    crop: 'limit',
                    quality: 82,
                    fetch_format: 'webp',
                },
            ],
        });
        const card = (_b = (_a = result.eager) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.secure_url;
        const thumb = (_d = (_c = result.eager) === null || _c === void 0 ? void 0 : _c[1]) === null || _d === void 0 ? void 0 : _d.secure_url;
        return {
            url: result.secure_url,
            width: result.width,
            height: result.height,
            variants: {
                ...(card ? { card } : {}),
                ...(thumb ? { thumb } : {}),
            },
        };
    }
    async uploadDocumentToCloudinary(file, folder) {
        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');
        const resourceType = isVideo ? 'video' : isImage ? 'image' : 'raw';
        const result = await this.uploadBuffer(file, {
            folder,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
        });
        return {
            url: result.secure_url,
            original_name: file.originalname,
            public_id: result.public_id,
        };
    }
    uploadBuffer(file, options) {
        const buffer = this.getBuffer(file);
        return new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream(options, (error, result) => {
                if (error || !result) {
                    reject(error !== null && error !== void 0 ? error : new Error('Cloudinary upload returned empty result'));
                    return;
                }
                resolve(result);
            });
            stream.end(buffer);
        });
    }
    async uploadImageLocally(file) {
        const filename = (0, multer_config_1.uploadImageFilename)(file.originalname);
        const dest = (0, path_1.join)((0, multer_config_1.getImagesUploadDir)(), filename);
        (0, fs_1.writeFileSync)(dest, this.getBuffer(file));
        // Dynamic import — Sharp never loads when CLOUD_STORAGE=true
        const { processUploadedImage } = await Promise.resolve().then(() => __importStar(require('./image-processor')));
        return processUploadedImage(dest, filename);
    }
    uploadDocumentLocally(file) {
        const filename = (0, multer_config_1.uploadDocumentFilename)(file.originalname);
        const dest = (0, path_1.join)((0, multer_config_1.getDocumentsUploadDir)(), filename);
        (0, fs_1.writeFileSync)(dest, this.getBuffer(file));
        return {
            url: `uploads/documents/${filename}`,
            original_name: file.originalname,
        };
    }
    getBuffer(file) {
        var _a;
        if ((_a = file.buffer) === null || _a === void 0 ? void 0 : _a.length) {
            return file.buffer;
        }
        if (file.path && (0, fs_1.existsSync)(file.path)) {
            const buf = (0, fs_1.readFileSync)(file.path);
            try {
                (0, fs_1.unlinkSync)(file.path);
            }
            catch (_b) {
                /* ignore */
            }
            return buf;
        }
        throw new Error('Uploaded file has no buffer or path');
    }
};
exports.CloudinaryService = CloudinaryService;
exports.CloudinaryService = CloudinaryService = CloudinaryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CloudinaryService);
