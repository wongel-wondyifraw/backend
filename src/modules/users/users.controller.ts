import { Controller, Get, Post, UseInterceptors, UploadedFile, Param, NotFoundException, Body, Patch, ParseUUIDPipe, Delete, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { join } from 'path';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { UsersService } from './users.service';
import { PinoLogger } from 'nestjs-pino';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequiresPermissions } from '../../common/decorators/permissions.decorator';
import {
    avatarFilenameForUserId,
    createImageDiskStorage,
    getImagesUploadDir,
    imageFileFilter,
    imageUploadLimits,
} from '../../common/config/multer.config';

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

    @Get(':id')
    @RequiresPermissions('users.read')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.findOne(id, true);
    }

    @Patch(':id')
    @RequiresPermissions('users.manage')
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Post()
    @RequiresPermissions('users.manage')
    @UseInterceptors(FileInterceptor('avatar', {
        storage: createImageDiskStorage((_req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `temp-${uniqueSuffix}${file.originalname.replace(/^.*(\.\w+)$/, '$1')}`);
        }),
        fileFilter: imageFileFilter,
        limits: imageUploadLimits,
    }))
    async create(@Body() createUserDto: CreateUserDto, @UploadedFile() file: Express.Multer.File | undefined) {
        const userId = randomUUID();
        let avatarUrl: string | null = null;

        if (file) {
            const filename = avatarFilenameForUserId(userId, file.originalname);
            const targetPath = join(getImagesUploadDir(), filename);

            try {
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
    @RequiresPermissions('settings.update', 'users.manage')
    @UseInterceptors(FileInterceptor('file', {
        storage: createImageDiskStorage((req, file, cb) => {
            const userId = (req as Express.Request & { params: { id: string } }).params.id;
            cb(null, avatarFilenameForUserId(userId, file.originalname));
        }),
        fileFilter: imageFileFilter,
        limits: imageUploadLimits,
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
