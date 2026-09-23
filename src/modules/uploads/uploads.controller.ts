import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequiresPermissions } from '../../common/decorators/permissions.decorator';
import {
  createDocumentDiskStorage,
  createImageDiskStorage,
  documentFileFilter,
  documentUploadLimits,
  imageFileFilter,
  imageUploadLimits,
  uploadDocumentFilename,
  uploadImageFilename,
} from '../../common/config/multer.config';
import { processUploadedImage } from './image-processor';

@Controller('uploads')
export class UploadsController {
  @Post('image')
  @RequiresPermissions('uploads.create', 'website.manage', 'members.update', 'members.create')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createImageDiskStorage((_req, file, cb) => {
        cb(null, uploadImageFilename(file.originalname));
      }),
      fileFilter: imageFileFilter,
      limits: imageUploadLimits,
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('File not found');
    }

    const processed = await processUploadedImage(file.path, file.filename);

    return {
      message: 'File uploaded successfully',
      url: processed.url,
      variants: processed.variants,
      width: processed.width,
      height: processed.height,
    };
  }

  @Post('document')
  @RequiresPermissions('uploads.create', 'website.manage', 'members.update', 'members.create')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createDocumentDiskStorage((_req, file, cb) => {
        cb(null, uploadDocumentFilename(file.originalname));
      }),
      fileFilter: documentFileFilter,
      limits: documentUploadLimits,
    }),
  )
  uploadDocument(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('File not found');
    }

    return {
      message: 'Document uploaded successfully',
      url: `uploads/documents/${file.filename}`,
      original_name: file.originalname,
    };
  }
}
