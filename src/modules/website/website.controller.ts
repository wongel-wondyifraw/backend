import {
  BadRequestException,
  Controller,
  Get,
  Body,
  Patch,
  Param,
} from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { WebsiteService } from "./website.service";
import { Public } from "../../common/decorators/public.decorator";
import { RequiresPermissions } from "../../common/decorators/permissions.decorator";
import {
  LANDING_CONTENT_KEYS,
  LandingPageContentDto,
} from "./dto/landing-page-content.dto";

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
  async updatePageContent(
    @Param("slug") slug: string,
    @Body() body: Record<string, unknown>,
  ) {
    let payload: unknown = body;
    if (
      body &&
      typeof body === "object" &&
      !Array.isArray(body) &&
      Object.prototype.hasOwnProperty.call(body, "content") &&
      Object.keys(body).every((k) => k === "content")
    ) {
      payload = body.content;
    }

    if (slug === "landing") {
      await this.assertLandingContent(payload);
    }

    return this.websiteService.updatePageContent(slug, payload);
  }

  private async assertLandingContent(payload: unknown): Promise<void> {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new BadRequestException("Landing content must be an object");
    }

    const keys = Object.keys(payload);
    const allowed = new Set<string>(LANDING_CONTENT_KEYS);
    const unknown = keys.filter((k) => !allowed.has(k));
    if (unknown.length) {
      throw new BadRequestException(
        `Unknown landing content keys: ${unknown.join(", ")}`,
      );
    }

    const dto = plainToInstance(LandingPageContentDto, payload, {
      enableImplicitConversion: true,
    });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length) {
      const messages = errors.flatMap((e) =>
        Object.values(e.constraints || {}),
      );
      throw new BadRequestException(
        messages.length ? messages.join("; ") : "Invalid landing content",
      );
    }
  }
}
