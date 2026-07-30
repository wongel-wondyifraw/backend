import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { BibleStudiesService } from './bible-studies.service';
import { CreateBibleStudyDto } from './dto/create-bible-study.dto';
import { UpdateBibleStudyDto } from './dto/update-bible-study.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RequiresPermissions } from '../../common/decorators/permissions.decorator';

@Controller('bible-studies')
export class BibleStudiesController {
  constructor(private readonly bibleStudiesService: BibleStudiesService) {}

  @Post()
  @RequiresPermissions('bible_studies.create')
  create(@Body() dto: CreateBibleStudyDto) {
    return this.bibleStudiesService.create(dto);
  }

  @Get()
  @RequiresPermissions('bible_studies.read')
  findAll(@Query() query: PaginationQueryDto) {
    return this.bibleStudiesService.findAllPaginated(query.page, query.limit, query.search);
  }

  @Get(':id')
  @RequiresPermissions('bible_studies.read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bibleStudiesService.findOne(id);
  }

  @Patch(':id')
  @RequiresPermissions('bible_studies.update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBibleStudyDto,
  ) {
    return this.bibleStudiesService.update(id, dto);
  }

  @Delete(':id')
  @RequiresPermissions('bible_studies.delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.bibleStudiesService.remove(id);
  }

  @Get(':id/members')
  @RequiresPermissions('bible_studies.read')
  getMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.bibleStudiesService.getMembers(id);
  }

  @Post(':id/members/:memberId')
  @RequiresPermissions('bible_studies.update')
  addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.bibleStudiesService.addMember(id, memberId);
  }

  @Delete(':id/members/:memberId')
  @RequiresPermissions('bible_studies.update')
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.bibleStudiesService.removeMember(id, memberId);
  }
}
