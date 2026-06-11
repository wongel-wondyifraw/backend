import { Controller, Get, Post, UseInterceptors, UploadedFile, Param, NotFoundException, Body, Patch, ParseUUIDPipe, Delete, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { UsersService } from './users.service';
import { PinoLogger } from 'nestjs-pino';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequiresPermissions } from '../../common/decorators/permissions.decorator';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly logger: PinoLogger,
    ) {
        this.logger.setContext('UsersController');
    }

    @Get()
    @RequiresPermissions('users.read')
    async findAll() {
        return this.usersService.findAll();
    }

    @Get('profile')
    async getProfile(@Request() req: { user: { id: string } }) {
        return this.usersService.findOne(req.user.id, true);
    }

    @Patch('profile')
    @RequiresPermissions('settings.update')
    async updateProfile(@Request() req: { user: { id: string } }, @Body() updateProfileDto: UpdateProfileDto) {
        return this.usersService.update(req.user.id, updateProfileDto);
    }

    @Patch('change-password')
    @RequiresPermissions('settings.update')
    async changePassword(@Request() req: { user: { id: string } }, @Body() changePasswordDto: ChangePasswordDto) {
        return this.usersService.changePassword(req.user.id, changePasswordDto);
    }

    @Patch(':id')
    @RequiresPermissions('users.manage')
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Post()
    @RequiresPermissions('users.manage')
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
    async create(@Body() createUserDto: CreateUserDto, @UploadedFile() file: Express.Multer.File | undefined) {
        const userId = randomUUID();
        let avatarUrl: string | null = null;

        if (file) {
            const fileExt = extname(file.originalname);
            const filename = `${userId}${fileExt}`;
            const targetPath = join(process.cwd(), 'uploads/images', filename);

            try {
                const uploadDir = join(process.cwd(), 'uploads/images');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                if (fs.existsSync(file.path)) {
                    fs.copyFileSync(file.path, targetPath);
                    fs.unlinkSync(file.path);
                }
                avatarUrl = `uploads/images/${filename}`;
            } catch (err) {
                this.logger.error({ err }, 'Error processing avatar during creation');
            }
        }

        const user = await this.usersService.create({
            ...createUserDto,
            id: userId,
            avatar_url: avatarUrl,
            created_at: new Date(),
        });

        return user;
    }

    @Delete(':id')
    @RequiresPermissions('users.manage')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.remove(id);
    }

    @Post(':id/upload-avatar')
    @RequiresPermissions('settings.update')
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
    async uploadAvatar(@Param('id', ParseUUIDPipe) id: string, @UploadedFile() file: Express.Multer.File | undefined) {
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
        } catch (error: unknown) {
            const err = error as Error;
            this.logger.error({
                userId: id,
                fileMetadata: file ? {
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                } : null,
                errorMessage: err.message,
            }, 'Failed to upload avatar');
            throw error;
        }
    }
}
