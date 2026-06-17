import {
    BadRequestException,
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    createImageDiskStorage,
    imageFileFilter,
    imageUploadLimits,
    uploadImageFilename,
} from '../../common/config/multer.config';

@Controller('uploads')
export class UploadsController {
    @Post('image')
    @UseInterceptors(FileInterceptor('file', {
        storage: createImageDiskStorage((_req, file, cb) => {
            cb(null, uploadImageFilename(file.originalname));
        }),
        fileFilter: imageFileFilter,
        limits: imageUploadLimits,
    }))
    uploadImage(@UploadedFile() file: Express.Multer.File | undefined) {
        if (!file) {
            throw new BadRequestException('File not found');
        }

        return {
            message: 'File uploaded successfully',
            url: `uploads/images/${file.filename}`,
        };
    }
}
