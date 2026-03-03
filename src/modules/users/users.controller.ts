import { Controller, Get, UseGuards, Request, Post, UseInterceptors, UploadedFile, Param, NotFoundException, Body, Patch } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

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
    @Patch(':id')
    async update(@Param('id') id: string, @Body() userData: any) {
        return this.usersService.update(id, userData);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/upload-avatar')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/images',
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
    async uploadAvatar(@Param('id') id: string, @UploadedFile() file: any) {
        if (!file) {
            throw new NotFoundException('File not found');
        }
        const avatarUrl = `/uploads/images/${file.filename}`;
        await this.usersService.updateAvatar(id, avatarUrl);
        return {
            message: 'Avatar uploaded successfully',
            avatar_url: avatarUrl,
        };
    }
}
