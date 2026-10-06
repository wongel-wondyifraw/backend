import { join, extname } from "path";
import * as fs from "fs";
import { randomUUID } from "crypto";
import { diskStorage } from "multer";

export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const ALLOWED_EXTENSION = /\.(jpe?g|png|gif|webp)$/i;

export function getUploadsRoot(): string {
  const fromEnv = process.env.UPLOADS_DIR?.trim();
  return fromEnv || join(process.cwd(), "uploads");
}

export function getImagesUploadDir(): string {
  const dir = join(getUploadsRoot(), "images");
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
    cb(new Error("Only image files (JPEG, PNG, GIF, WebP) are allowed"), false);
    return;
  }

  cb(null, true);
}

export const imageUploadLimits = {
  fileSize: IMAGE_UPLOAD_MAX_BYTES,
};

export function createImageDiskStorage(
  filename: (
    req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) => void,
) {
  return diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, getImagesUploadDir());
    },
    filename,
  });
}

export function createDefaultImageDiskStorage() {
  return createImageDiskStorage((_req, file, cb) => {
    cb(null, uploadImageFilename(file.originalname));
  });
}

export function createAvatarImageDiskStorage() {
  return createImageDiskStorage((_req, file, cb) => {
    cb(null, `avatar-${randomUUID()}${extname(file.originalname)}`);
  });
}

export function uploadImageFilename(originalname: string): string {
  return `upload-${randomUUID()}${extname(originalname)}`;
}

export const DOCUMENT_UPLOAD_MAX_BYTES = 15 * 1024 * 1024;

const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const ALLOWED_DOCUMENT_EXTENSION = /\.(pdf|docx?|txt|jpe?g|png|mp4|webm|mov)$/i;

export function getDocumentsUploadDir(): string {
  const dir = join(getUploadsRoot(), "documents");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function documentFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void {
  const mimeOk = ALLOWED_DOCUMENT_MIME_TYPES.has(file.mimetype);
  const extOk = ALLOWED_DOCUMENT_EXTENSION.test(file.originalname);

  if (!mimeOk || !extOk) {
    cb(
      new Error(
        "Only PDF, DOC, DOCX, TXT, JPEG, PNG, or video (MP4/WebM) files are allowed",
      ),
      false,
    );
    return;
  }

  cb(null, true);
}

export const documentUploadLimits = {
  fileSize: DOCUMENT_UPLOAD_MAX_BYTES,
};

export function createDocumentDiskStorage(
  filename: (
    req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) => void,
) {
  return diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, getDocumentsUploadDir());
    },
    filename,
  });
}

export function createDefaultDocumentDiskStorage() {
  return createDocumentDiskStorage((_req, file, cb) => {
    cb(null, uploadDocumentFilename(file.originalname));
  });
}

export function uploadDocumentFilename(originalname: string): string {
  return `doc-${randomUUID()}${extname(originalname)}`;
}

export function ensureUploadDirs(): void {
  getImagesUploadDir();
  getDocumentsUploadDir();
}
