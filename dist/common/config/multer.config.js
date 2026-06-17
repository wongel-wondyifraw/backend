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
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageUploadLimits = exports.IMAGE_UPLOAD_MAX_BYTES = void 0;
exports.getImagesUploadDir = getImagesUploadDir;
exports.imageFileFilter = imageFileFilter;
exports.createImageDiskStorage = createImageDiskStorage;
exports.avatarFilenameForUserId = avatarFilenameForUserId;
exports.uploadImageFilename = uploadImageFilename;
const path_1 = require("path");
const fs = __importStar(require("fs"));
const crypto_1 = require("crypto");
const multer_1 = require("multer");
exports.IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
]);
const ALLOWED_EXTENSION = /\.(jpe?g|png|gif|webp)$/i;
function getImagesUploadDir() {
    const dir = (0, path_1.join)(process.cwd(), 'uploads', 'images');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}
function imageFileFilter(_req, file, cb) {
    const mimeOk = ALLOWED_MIME_TYPES.has(file.mimetype);
    const extOk = ALLOWED_EXTENSION.test(file.originalname);
    if (!mimeOk || !extOk) {
        cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
        return;
    }
    cb(null, true);
}
exports.imageUploadLimits = {
    fileSize: exports.IMAGE_UPLOAD_MAX_BYTES,
};
function createImageDiskStorage(filename) {
    return (0, multer_1.diskStorage)({
        destination: (_req, _file, cb) => {
            cb(null, getImagesUploadDir());
        },
        filename,
    });
}
function avatarFilenameForUserId(userId, originalname) {
    return `${userId}${(0, path_1.extname)(originalname)}`;
}
function uploadImageFilename(originalname) {
    return `upload-${(0, crypto_1.randomUUID)()}${(0, path_1.extname)(originalname)}`;
}
