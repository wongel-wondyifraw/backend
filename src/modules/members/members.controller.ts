import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MinistriesService } from '../ministries/ministries.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express/multer/interceptors/file-fields.interceptor';

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
    constructor(
        private readonly membersService: MembersService,
        private readonly ministriesService: MinistriesService,
    ) { }

    // members.controller.ts
@Post()
@UseInterceptors(FileFieldsInterceptor([
    { name: 'avatar', maxCount: 1 },
    { name: 'document', maxCount: 1 },
]))
async create(
    @Body() createMemberDto: CreateMemberDto,
    @UploadedFiles() files: { avatar?: Express.Multer.File[], document?: Express.Multer.File[] }
) {
    return this.membersService.create(createMemberDto, files.avatar?.[0], files.document?.[0]);
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
