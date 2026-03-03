import { Controller, Get, UseGuards, Request, Post, UseInterceptors, UploadedFile, Param, NotFoundException, Body, Patch, ParseUUIDPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PinoLogger } from 'nestjs-pino';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly logger: PinoLogger,
    ) {
        this.logger.setContext('UsersController');
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll() {
        return this.usersService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Request() req: any) {
        // req.user is set by the JwtStrategy's validate method
        return this.usersService.findOne(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    async updateProfile(@Request() req: any, @Body() userData: any) {
        return this.usersService.update(req.user.id, userData);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('change-password')
    async changePassword(@Request() req: any, @Body() body: any) {
        return this.usersService.changePassword(req.user.id, body);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() userData: any) {
        return this.usersService.update(id, userData);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/upload-avatar')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = './uploads/images';
                if (!fs.existsSync(uploadPath)) {
                    fs.mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const userId = req.params.id;
                const fileExtName = extname(file.originalname);
                // Renaming by UUID as requested: [userId][ext]
                cb(null, `${userId}${fileExtName}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
                return cb(new Error('Only image files are allowed!'), false);
            }
            cb(null, true);
        },
    }))
    async uploadAvatar(@Param('id', ParseUUIDPipe) id: string, @UploadedFile() file: any) {
        try {
            if (!file) {
                throw new NotFoundException('File not found');
            }
            const avatarUrl = `/uploads/images/${file.filename}`;
            await this.usersService.updateAvatar(id, avatarUrl);
            return {
                message: 'Avatar uploaded successfully',
                avatar_url: avatarUrl,
            };
        } catch (error: any) {
            this.logger.error({
                userId: id,
                fileMetadata: file ? {
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                } : null,
                errorMessage: error.message,
            }, 'Failed to upload avatar');
            throw error;
        }
    }
}
