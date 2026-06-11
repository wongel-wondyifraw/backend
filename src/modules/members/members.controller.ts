import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MinistriesService } from '../ministries/ministries.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RequiresPermissions } from '../../common/decorators/permissions.decorator';

@Controller('members')
export class MembersController {
    constructor(
        private readonly membersService: MembersService,
        private readonly ministriesService: MinistriesService,
    ) { }

    @Post()
    @RequiresPermissions('members.create')
    async create(@Body() createMemberDto: CreateMemberDto) {
        return this.membersService.create(createMemberDto);
    }

    @Get()
    @RequiresPermissions('members.read')
    async findAll(@Query() query: PaginationQueryDto) {
        return this.membersService.findAllPaginated(query.page, query.limit, query.search);
    }

    @Get(':id')
    @RequiresPermissions('members.read')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.membersService.findOne(id);
    }

    @Patch(':id')
    @RequiresPermissions('members.update')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateMemberDto: UpdateMemberDto,
    ) {
        return this.membersService.update(id, updateMemberDto);
    }

    @Delete(':id')
    @RequiresPermissions('members.delete')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.membersService.remove(id);
    }

    @Get(':id/ministries')
    @RequiresPermissions('members.read')
    async getMemberMinistries(@Param('id', ParseUUIDPipe) id: string) {
        return this.ministriesService.getMemberMinistries(id);
    }
}
