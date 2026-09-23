import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  getDocumentsUploadDir,
  getImagesUploadDir,
  uploadDocumentFilename,
  uploadImageFilename,
} from '../../common/config/multer.config';
import {
  processUploadedImage,
  ProcessedImage,
} from './image-processor';

export type UploadedDocument = {
  url: string;
  original_name: string;
  public_id?: string;
};

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const cloudStorage = this.config.get<string>('CLOUD_STORAGE') === 'true';
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    const hasCredentials = Boolean(cloudName && apiKey && apiSecret);

    this.enabled = cloudStorage && hasCredentials;

    if (cloudStorage && !hasCredentials) {
      this.logger.error(
        'CLOUD_STORAGE=true but CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET are missing — using local storage',
      );
    }

    if (this.enabled) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.logger.log('Cloud storage enabled (Cloudinary)');
    } else {
      this.logger.log('Cloud storage disabled — using local uploads/ + Sharp');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = 'cms/images',
  ): Promise<ProcessedImage> {
    if (this.enabled) {
      return this.uploadImageToCloudinary(file, folder);
    }
    return this.uploadImageLocally(file);
  }

  async uploadDocument(
    file: Express.Multer.File,
    folder = 'cms/documents',
  ): Promise<UploadedDocument> {
    if (this.enabled) {
      return this.uploadDocumentToCloudinary(file, folder);
    }
    return this.uploadDocumentLocally(file);
  }

  private async uploadImageToCloudinary(
    file: Express.Multer.File,
    folder: string,
  ): Promise<ProcessedImage> {
    const result = await this.uploadBuffer(file, {
      folder,
      resource_type: 'image',
      eager: [
        { width: 800, height: 800, crop: 'limit', quality: 78, fetch_format: 'webp' },
        { width: 320, height: 320, crop: 'fill', gravity: 'auto', quality: 72, fetch_format: 'webp' },
      ],
      eager_async: false,
      transformation: [
        { width: 1920, height: 1920, crop: 'limit', quality: 82, fetch_format: 'webp' },
      ],
    });

    const card = result.eager?.[0]?.secure_url;
    const thumb = result.eager?.[1]?.secure_url;

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

  private async uploadDocumentToCloudinary(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadedDocument> {
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

  private uploadBuffer(
    file: Express.Multer.File,
    options: Record<string, unknown>,
  ): Promise<UploadApiResponse> {
    const buffer = this.getBuffer(file);

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload returned empty result'));
            return;
          }
          resolve(result);
        },
      );
      stream.end(buffer);
    });
  }

  private async uploadImageLocally(
    file: Express.Multer.File,
  ): Promise<ProcessedImage> {
    const filename = uploadImageFilename(file.originalname);
    const dest = join(getImagesUploadDir(), filename);
    writeFileSync(dest, this.getBuffer(file));
    return processUploadedImage(dest, filename);
  }

  private uploadDocumentLocally(file: Express.Multer.File): UploadedDocument {
    const filename = uploadDocumentFilename(file.originalname);
    const dest = join(getDocumentsUploadDir(), filename);
    writeFileSync(dest, this.getBuffer(file));
    return {
      url: `uploads/documents/${filename}`,
      original_name: file.originalname,
    };
  }

  private getBuffer(file: Express.Multer.File): Buffer {
    if (file.buffer?.length) {
      return file.buffer;
    }
    if (file.path && existsSync(file.path)) {
      const buf = readFileSync(file.path);
      try {
        unlinkSync(file.path);
      } catch {
        /* ignore */
      }
      return buf;
    }
    throw new Error('Uploaded file has no buffer or path');
  }
}
