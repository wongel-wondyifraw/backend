import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { MinistriesService } from './ministries.service';
import { CreateMinistryDto } from './dto/create-ministry.dto';
import { UpdateMinistryDto } from './dto/update-ministry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ministries')
@UseGuards(JwtAuthGuard)
export class MinistriesController {
    constructor(private readonly ministriesService: MinistriesService) { }

    @Post()
    async create(@Body() createMinistryDto: CreateMinistryDto) {
        return this.ministriesService.create(createMinistryDto);
    }

    @Get()
    async findAll() {
        return this.ministriesService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.ministriesService.findOne(id);
    }

    @Patch(':id')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateMinistryDto: UpdateMinistryDto,
    ) {
        return this.ministriesService.update(id, updateMinistryDto);
    }

    @Delete(':id')
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.ministriesService.remove(id);
    }

    // ==================== Ministry Members ====================

    @Get(':id/members')
    async getMinistryMembers(@Param('id', ParseUUIDPipe) id: string) {
        return this.ministriesService.getMinistryMembers(id);
    }

    @Post(':id/members/:memberId')
    async addMember(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('memberId', ParseUUIDPipe) memberId: string,
    ) {
        return this.ministriesService.addMember(id, memberId);
    }

    @Delete(':id/members/:memberId')
    async removeMember(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('memberId', ParseUUIDPipe) memberId: string,
    ) {
        return this.ministriesService.removeMember(id, memberId);
    }
}
