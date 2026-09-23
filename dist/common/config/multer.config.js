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
exports.documentUploadLimits = exports.DOCUMENT_UPLOAD_MAX_BYTES = exports.imageUploadLimits = exports.IMAGE_UPLOAD_MAX_BYTES = void 0;
exports.getImagesUploadDir = getImagesUploadDir;
exports.imageFileFilter = imageFileFilter;
exports.createImageDiskStorage = createImageDiskStorage;
exports.createImageMemoryStorage = createImageMemoryStorage;
exports.createDocumentMemoryStorage = createDocumentMemoryStorage;
exports.avatarFilenameForUserId = avatarFilenameForUserId;
exports.uploadImageFilename = uploadImageFilename;
exports.getDocumentsUploadDir = getDocumentsUploadDir;
exports.documentFileFilter = documentFileFilter;
exports.createDocumentDiskStorage = createDocumentDiskStorage;
exports.uploadDocumentFilename = uploadDocumentFilename;
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
/** Prefer memory storage so files can go straight to Cloudinary without disk I/O. */
function createImageMemoryStorage() {
    return (0, multer_1.memoryStorage)();
}
function createDocumentMemoryStorage() {
    return (0, multer_1.memoryStorage)();
}
function avatarFilenameForUserId(userId, originalname) {
    return `${userId}${(0, path_1.extname)(originalname)}`;
}
function uploadImageFilename(originalname) {
    return `upload-${(0, crypto_1.randomUUID)()}${(0, path_1.extname)(originalname)}`;
}
exports.DOCUMENT_UPLOAD_MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'video/mp4',
    'video/webm',
    'video/quicktime',
]);
const ALLOWED_DOCUMENT_EXTENSION = /\.(pdf|docx?|txt|jpe?g|png|mp4|webm|mov)$/i;
function getDocumentsUploadDir() {
    const dir = (0, path_1.join)(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}
function documentFileFilter(_req, file, cb) {
    const mimeOk = ALLOWED_DOCUMENT_MIME_TYPES.has(file.mimetype);
    const extOk = ALLOWED_DOCUMENT_EXTENSION.test(file.originalname);
    if (!mimeOk || !extOk) {
        cb(new Error('Only PDF, DOC, DOCX, TXT, JPEG, PNG, or video (MP4/WebM) files are allowed'), false);
        return;
    }
    cb(null, true);
}
exports.documentUploadLimits = {
    fileSize: exports.DOCUMENT_UPLOAD_MAX_BYTES,
};
function createDocumentDiskStorage(filename) {
    return (0, multer_1.diskStorage)({
        destination: (_req, _file, cb) => {
            cb(null, getDocumentsUploadDir());
        },
        filename,
    });
}
function uploadDocumentFilename(originalname) {
    return `doc-${(0, crypto_1.randomUUID)()}${(0, path_1.extname)(originalname)}`;
}
