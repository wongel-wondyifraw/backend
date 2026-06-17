import { join, extname } from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';

export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
]);

const ALLOWED_EXTENSION = /\.(jpe?g|png|gif|webp)$/i;

export function getImagesUploadDir(): string {
    const dir = join(process.cwd(), 'uploads', 'images');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

export function imageFileFilter(
    _req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
): void {
    const mimeOk = ALLOWED_MIME_TYPES.has(file.mimetype);
    const extOk = ALLOWED_EXTENSION.test(file.originalname);

    if (!mimeOk || !extOk) {
        cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
        return;
    }

    cb(null, true);
}

export const imageUploadLimits = {
    fileSize: IMAGE_UPLOAD_MAX_BYTES,
};

export function createImageDiskStorage(
    filename: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => void,
) {
    return diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, getImagesUploadDir());
        },
        filename,
    });
}

export function avatarFilenameForUserId(userId: string, originalname: string): string {
    return `${userId}${extname(originalname)}`;
}

export function uploadImageFilename(originalname: string): string {
    return `upload-${randomUUID()}${extname(originalname)}`;
}
