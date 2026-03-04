import { Controller, Get, UseGuards, Request, Post, UseInterceptors, UploadedFile, Param, NotFoundException, Body, Patch, ParseUUIDPipe, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PinoLogger } from 'nestjs-pino';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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
    async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
        return this.usersService.update(req.user.id, updateProfileDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('change-password')
    async changePassword(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
        return this.usersService.changePassword(req.user.id, changePasswordDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    @UseInterceptors(FileInterceptor('avatar', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = join(process.cwd(), 'uploads/images');
                if (!fs.existsSync(uploadPath)) {
                    fs.mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `temp-${uniqueSuffix}${extname(file.originalname)}`);
            },
        }),
    }))
    async create(@Body() createUserDto: CreateUserDto, @UploadedFile() file: any) {
        // 1. Generate the UUID for the new user
        const userId = randomUUID();
        let avatarUrl = null;

        // 2. If a file was uploaded, move it to the final location immediately
        if (file) {
            const fileExt = extname(file.originalname);
            const filename = `${userId}${fileExt}`;
            const targetPath = join(process.cwd(), 'uploads/images', filename);

            try {
                // Ensure directory exists
                const uploadDir = join(process.cwd(), 'uploads/images');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                // Move file - use copy + unlink for cross-partition reliability
                if (fs.existsSync(file.path)) {
                    fs.copyFileSync(file.path, targetPath);
                    fs.unlinkSync(file.path);
                }
                avatarUrl = `uploads/images/${filename}`;
            } catch (err) {
                console.error('Error processing avatar during creation:', err);
                // We'll continue even if file processing fails, but avatarUrl remains null
            }
        }

        // 3. Create the user record with the pre-generated ID and avatar_url
        const user = await this.usersService.create({
            ...createUserDto,
            id: userId,
            avatar_url: avatarUrl,
            created_at: new Date(), // Explicitly set created_at as requested
        });

        return user;
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.remove(id);
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
            const avatarUrl = `uploads/images/${file.filename}`;
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
