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
exports.processUploadedImage = processUploadedImage;
const path_1 = require("path");
const fs = __importStar(require("fs"));
const multer_config_1 = require("../../common/config/multer.config");
/**
 * Local-only image optimize (Sharp). Loaded dynamically so Cloudinary
 * deployments never pull Sharp into memory at boot.
 */
async function processUploadedImage(filePath, filename) {
    const dir = (0, multer_config_1.getImagesUploadDir)();
    const base = filename.replace(/\.[^.]+$/, "");
    const variants = {};
    try {
        const sharp = (await Promise.resolve().then(() => __importStar(require("sharp")))).default;
        const image = sharp(filePath);
        const meta = await image.metadata();
        const mainName = `${base}.webp`;
        const mainPath = (0, path_1.join)(dir, mainName);
        await sharp(filePath)
            .rotate()
            .resize({
            width: 1920,
            height: 1920,
            fit: "inside",
            withoutEnlargement: true,
        })
            .webp({ quality: 82 })
            .toFile(mainPath);
        const cardName = `${base}-card.webp`;
        await sharp(filePath)
            .rotate()
            .resize({
            width: 800,
            height: 800,
            fit: "inside",
            withoutEnlargement: true,
        })
            .webp({ quality: 78 })
            .toFile((0, path_1.join)(dir, cardName));
        variants.card = `uploads/images/${cardName}`;
        const thumbName = `${base}-thumb.webp`;
        await sharp(filePath)
            .rotate()
            .resize({ width: 320, height: 320, fit: "cover" })
            .webp({ quality: 72 })
            .toFile((0, path_1.join)(dir, thumbName));
        variants.thumb = `uploads/images/${thumbName}`;
        if (filename !== mainName && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            }
            catch (_a) {
                /* ignore */
            }
        }
        return {
            url: `uploads/images/${mainName}`,
            width: meta.width,
            height: meta.height,
            variants,
        };
    }
    catch (_b) {
        return {
            url: `uploads/images/${filename}`,
            variants: {},
        };
    }
}
