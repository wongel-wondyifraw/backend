import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { RequiresPermissions } from "../../common/decorators/permissions.decorator";
import {
  createDefaultDocumentDiskStorage,
  createDefaultImageDiskStorage,
  documentFileFilter,
  documentUploadLimits,
  imageFileFilter,
  imageUploadLimits,
} from "../../common/config/multer.config";
import { LocalStorageService } from "./local-storage.service";

@Controller("uploads")
export class UploadsController {
  constructor(private readonly storage: LocalStorageService) {}

  @Post("image")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @RequiresPermissions(
    "uploads.create",
    "website.manage",
    "members.update",
    "members.create",
  )
  @UseInterceptors(
    FileInterceptor("file", {
      storage: createDefaultImageDiskStorage(),
      fileFilter: imageFileFilter,
      limits: imageUploadLimits,
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException("File not found");
    }

    const processed = await this.storage.uploadImage(file);

    return {
      message: "File uploaded successfully",
      url: processed.url,
      variants: processed.variants,
      width: processed.width,
      height: processed.height,
    };
  }

  @Post("document")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @RequiresPermissions(
    "uploads.create",
    "website.manage",
    "members.update",
    "members.create",
  )
  @UseInterceptors(
    FileInterceptor("file", {
      storage: createDefaultDocumentDiskStorage(),
      fileFilter: documentFileFilter,
      limits: documentUploadLimits,
    }),
  )
  async uploadDocument(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException("File not found");
    }

    const uploaded = this.storage.uploadDocument(file);

    return {
      message: "Document uploaded successfully",
      url: uploaded.url,
      original_name: uploaded.original_name,
    };
  }
}
