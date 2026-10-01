import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { RequiresPermissions } from "../../common/decorators/permissions.decorator";
import {
  createDocumentMemoryStorage,
  createImageMemoryStorage,
  documentFileFilter,
  documentUploadLimits,
  imageFileFilter,
  imageUploadLimits,
} from "../../common/config/multer.config";
import { CloudinaryService } from "./cloudinary.service";

@Controller("uploads")
export class UploadsController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  @Post("image")
  @RequiresPermissions(
    "uploads.create",
    "website.manage",
    "members.update",
    "members.create",
  )
  @UseInterceptors(
    FileInterceptor("file", {
      storage: createImageMemoryStorage(),
      fileFilter: imageFileFilter,
      limits: imageUploadLimits,
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException("File not found");
    }

    const processed = await this.cloudinary.uploadImage(file, "cms/images");

    return {
      message: "File uploaded successfully",
      url: processed.url,
      variants: processed.variants,
      width: processed.width,
      height: processed.height,
    };
  }

  @Post("document")
  @RequiresPermissions(
    "uploads.create",
    "website.manage",
    "members.update",
    "members.create",
  )
  @UseInterceptors(
    FileInterceptor("file", {
      storage: createDocumentMemoryStorage(),
      fileFilter: documentFileFilter,
      limits: documentUploadLimits,
    }),
  )
  async uploadDocument(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException("File not found");
    }

    const uploaded = await this.cloudinary.uploadDocument(
      file,
      "cms/documents",
    );

    return {
      message: "Document uploaded successfully",
      url: uploaded.url,
      original_name: uploaded.original_name,
    };
  }
}
