import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MinistriesService } from '../ministries/ministries.service';

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
    constructor(
        private readonly membersService: MembersService,
        private readonly ministriesService: MinistriesService,
    ) { }

    @Post()
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'avatar', maxCount: 1 },
        { name: 'document', maxCount: 1 },
    ], {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const subfolder = file.fieldname === 'avatar' ? 'images' : 'documents';
                const uploadPath = join(process.cwd(), 'uploads', subfolder);
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
    async create(
        @Body() createMemberDto: CreateMemberDto,
        @UploadedFiles() files: { avatar?: Express.Multer.File[]; document?: Express.Multer.File[] },
    ) {
        const memberId = randomUUID();
        let imageUrl: string | undefined = undefined;
        let documentUrl: string | undefined = undefined;

        // Process avatar file
        if (files?.avatar?.[0]) {
            const file = files.avatar[0];
            const fileExt = extname(file.originalname);
            const filename = `${memberId}${fileExt}`;
            const targetPath = join(process.cwd(), 'uploads/images', filename);

            try {
                if (fs.existsSync(file.path)) {
                    fs.copyFileSync(file.path, targetPath);
                    fs.unlinkSync(file.path);
                }
                imageUrl = `uploads/images/${filename}`;
            } catch (err) {
                console.error('Error processing member avatar:', err);
            }
        }

        // Process document (church letter) file
        if (files?.document?.[0]) {
            const file = files.document[0];
            const fileExt = extname(file.originalname);
            const filename = `${memberId}-letter${fileExt}`;
            const targetPath = join(process.cwd(), 'uploads/documents', filename);

            try {
                if (fs.existsSync(file.path)) {
                    fs.copyFileSync(file.path, targetPath);
                    fs.unlinkSync(file.path);
                }
                documentUrl = `uploads/documents/${filename}`;
            } catch (err) {
                console.error('Error processing member document:', err);
            }
        }

        return this.membersService.create({
            ...createMemberDto,
            image_url: imageUrl,
            document_url: documentUrl,
        }, memberId);
    }

    @Get()
    async findAll() {
        return this.membersService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.membersService.findOne(id);
    }

    @Patch(':id')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateMemberDto: UpdateMemberDto,
    ) {
        return this.membersService.update(id, updateMemberDto);
    }

    @Delete(':id')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.membersService.remove(id);
    }

    @Get(':id/ministries')
    async getMemberMinistries(@Param('id', ParseUUIDPipe) id: string) {
        return this.ministriesService.getMemberMinistries(id);
    }
}
