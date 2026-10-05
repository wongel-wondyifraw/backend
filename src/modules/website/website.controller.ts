import {
  BadRequestException,
  Controller,
  Get,
  Body,
  Patch,
  Param,
} from "@nestjs/common";
import { plainToInstance, instanceToPlain } from "class-transformer";
import { validate, type ValidationError } from "class-validator";
import { WebsiteService } from "./website.service";
import { Public } from "../../common/decorators/public.decorator";
import { RequiresPermissions } from "../../common/decorators/permissions.decorator";
import {
  LANDING_CONTENT_KEYS,
  LandingPageContentDto,
} from "./dto/landing-page-content.dto";

function flattenValidationErrors(
  errors: ValidationError[],
  prefix = "",
): string[] {
  const out: string[] = [];
  for (const error of errors) {
    const path = prefix ? `${prefix}.${error.property}` : error.property;
    if (error.constraints) {
      for (const message of Object.values(error.constraints)) {
        out.push(`${path}: ${message}`);
      }
    }
    if (error.children?.length) {
      out.push(...flattenValidationErrors(error.children, path));
    }
  }
  return out;
}

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
      payload = await this.sanitizeLandingContent(payload);
    }

    return this.websiteService.updatePageContent(slug, payload);
  }

  /**
   * Landing CMS JSON often carries legacy nested keys from older seeds.
   * Whitelist/strip unknowns instead of failing with a opaque 400, and
   * persist the cleaned shape so the next save stays clean.
   */
  private async sanitizeLandingContent(
    payload: unknown,
  ): Promise<Record<string, unknown>> {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new BadRequestException("Landing content must be an object");
    }

    const raw = payload as Record<string, unknown>;
    const pruned: Record<string, unknown> = {};
    for (const key of LANDING_CONTENT_KEYS) {
      if (Object.prototype.hasOwnProperty.call(raw, key)) {
        pruned[key] = raw[key];
      }
    }

    const dto = plainToInstance(LandingPageContentDto, pruned, {
      enableImplicitConversion: true,
      exposeUnsetFields: false,
    });

    // Strip unknown nested fields; only fail on real type errors.
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });
    if (errors.length) {
      const messages = flattenValidationErrors(errors);
      throw new BadRequestException(
        messages.length ? messages.join("; ") : "Invalid landing content",
      );
    }

    return instanceToPlain(dto) as Record<string, unknown>;
  }
}
