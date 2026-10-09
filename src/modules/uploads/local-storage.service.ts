import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { existsSync, readFileSync, unlinkSync } from "fs";
import { basename } from "path";
import {
  isAllowedDocumentMagic,
  isAllowedImageMagic,
} from "../../common/config/file-magic";
import type { ProcessedImage } from "./image-types";
import { processUploadedImage } from "./image-processor";

export type UploadedDocument = {
  url: string;
  original_name: string;
};

@Injectable()
export class LocalStorageService {
  private readonly logger = new Logger(LocalStorageService.name);

  async uploadImage(file: Express.Multer.File): Promise<ProcessedImage> {
    const dest = this.requirePath(file);
    const buf = readFileSync(dest);
    if (!isAllowedImageMagic(buf)) {
      this.remove(dest);
      throw new BadRequestException(
        "File content does not match an allowed image type",
      );
    }

    return processUploadedImage(dest, basename(file.filename || dest));
  }

  uploadDocument(file: Express.Multer.File): UploadedDocument {
    const dest = this.requirePath(file);
    const buf = readFileSync(dest);
    if (!isAllowedDocumentMagic(buf, file.originalname)) {
      this.remove(dest);
      throw new BadRequestException(
        "File content does not match an allowed document type",
      );
    }

    return {
      url: `uploads/documents/${basename(file.filename || dest)}`,
      original_name: file.originalname,
    };
  }

  private requirePath(file: Express.Multer.File): string {
    if (file.path && existsSync(file.path)) {
      return file.path;
    }
    throw new BadRequestException("Uploaded file has no path");
  }

  private remove(path: string): void {
    try {
      unlinkSync(path);
    } catch (err) {
      this.logger.warn(
        `Failed to remove rejected upload at ${path}: ${String(err)}`,
      );
    }
  }
}
