import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { MinistriesService } from './ministries.service';
import { CreateMinistryDto } from './dto/create-ministry.dto';
import { UpdateMinistryDto } from './dto/update-ministry.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RequiresPermissions } from '../../common/decorators/permissions.decorator';

@Controller('ministries')
export class MinistriesController {
    constructor(private readonly ministriesService: MinistriesService) { }

    @Post()
    @RequiresPermissions('ministries.create')
    async create(@Body() createMinistryDto: CreateMinistryDto) {
        return this.ministriesService.create(createMinistryDto);
    }

    @Get()
    @RequiresPermissions('ministries.read')
    async findAll(@Query() query: PaginationQueryDto) {
        return this.ministriesService.findAllPaginated(query.page, query.limit, query.search);
    }

    @Get(':id')
    @RequiresPermissions('ministries.read')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.ministriesService.findOne(id);
    }

    @Patch(':id')
    @RequiresPermissions('ministries.update')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateMinistryDto: UpdateMinistryDto,
    ) {
        return this.ministriesService.update(id, updateMinistryDto);
    }

    @Delete(':id')
    @RequiresPermissions('ministries.delete')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.ministriesService.remove(id);
    }

    @Get(':id/members')
    @RequiresPermissions('ministries.read')
    async getMinistryMembers(@Param('id', ParseUUIDPipe) id: string) {
        return this.ministriesService.getMinistryMembers(id);
    }

    @Post(':id/members/:memberId')
    @RequiresPermissions('ministries.update')
    async addMember(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('memberId', ParseUUIDPipe) memberId: string,
    ) {
        return this.ministriesService.addMember(id, memberId);
    }

    @Delete(':id/members/:memberId')
    @RequiresPermissions('ministries.update')
    async removeMember(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('memberId', ParseUUIDPipe) memberId: string,
    ) {
        return this.ministriesService.removeMember(id, memberId);
    }
}
