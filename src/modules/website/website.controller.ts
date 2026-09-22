import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { WebsiteService } from './website.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequiresPermissions } from '../../common/decorators/permissions.decorator';

@Controller('website')
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  // Public Endpoints
  @Get('pages/:slug')
  getPageContent(@Param('slug') slug: string) {
    return this.websiteService.getPageContent(slug);
  }

  @Get('projects')
  getProjects(@Query('status') status?: string) {
    return this.websiteService.getProjects(status);
  }

  @Get('projects/:id')
  getProject(@Param('id') id: string) {
    return this.websiteService.getProject(id);
  }

  // Admin Endpoints
  @Patch('pages/:slug')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiresPermissions('website.manage')
  updatePageContent(@Param('slug') slug: string, @Body() content: any) {
    return this.websiteService.updatePageContent(slug, content);
  }

  @Post('projects')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiresPermissions('projects.manage')
  createProject(@Body() data: any) {
    return this.websiteService.createProject(data);
  }

  @Patch('projects/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiresPermissions('projects.manage')
  updateProject(@Param('id') id: string, @Body() data: any) {
    return this.websiteService.updateProject(id, data);
  }

  @Delete('projects/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiresPermissions('projects.manage')
  deleteProject(@Param('id') id: string) {
    return this.websiteService.deleteProject(id);
  }
}
