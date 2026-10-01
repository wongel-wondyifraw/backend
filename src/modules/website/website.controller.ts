import { Controller, Get, Body, Patch, Param } from "@nestjs/common";
import { WebsiteService } from "./website.service";
import { Public } from "../../common/decorators/public.decorator";
import { RequiresPermissions } from "../../common/decorators/permissions.decorator";

@Controller("website")
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Public()
  @Get("pages/:slug")
  getPageContent(@Param("slug") slug: string) {
    return this.websiteService.getPageContent(slug);
  }

  @Patch("pages/:slug")
  @RequiresPermissions("website.manage")
  updatePageContent(@Param("slug") slug: string, @Body() content: any) {
    return this.websiteService.updatePageContent(slug, content);
  }
}
