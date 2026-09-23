import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { WebsiteService } from './website.service';
import { Public } from '../../common/decorators/public.decorator';
import { RequiresPermissions } from '../../common/decorators/permissions.decorator';

@Controller('website')
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Public()
  @Get('pages/:slug')
  getPageContent(@Param('slug') slug: string) {
    return this.websiteService.getPageContent(slug);
  }

  @Public()
  @Get('projects')
  getProjects(@Query('status') status?: string) {
    return this.websiteService.getProjects(status);
  }

  @Public()
  @Get('projects/:id')
  getProject(@Param('id') id: string) {
    return this.websiteService.getProject(id);
  }

  @Patch('pages/:slug')
  @RequiresPermissions('website.manage')
  updatePageContent(@Param('slug') slug: string, @Body() content: any) {
    return this.websiteService.updatePageContent(slug, content);
  }

  @Post('projects')
  @RequiresPermissions('projects.manage')
  createProject(@Body() data: any) {
    return this.websiteService.createProject(data);
  }

  @Patch('projects/:id')
  @RequiresPermissions('projects.manage')
  updateProject(@Param('id') id: string, @Body() data: any) {
    return this.websiteService.updateProject(id, data);
  }

  @Delete('projects/:id')
  @RequiresPermissions('projects.manage')
  deleteProject(@Param('id') id: string) {
    return this.websiteService.deleteProject(id);
  }
}
