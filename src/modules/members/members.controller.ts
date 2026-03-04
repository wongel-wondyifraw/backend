import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
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
    async create(@Body() createMemberDto: CreateMemberDto) {
        return this.membersService.create(createMemberDto);
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
