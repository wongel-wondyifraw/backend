import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PageContent } from "./entities/page-content.entity";

type CachedPage = {
  value: {
    page_slug: string;
    content: unknown;
    created_at?: Date;
    updated_at?: Date;
  };
  expiresAt: number;
};

const PAGE_CACHE_TTL_MS = 60_000;

@Injectable()
export class WebsiteService {
  private readonly pageCache = new Map<string, CachedPage>();

  constructor(
    @InjectRepository(PageContent)
    private readonly pageContentRepo: Repository<PageContent>,
  ) {}

  async getPageContent(
    slug: string,
  ): Promise<{
    page_slug: string;
    content: unknown;
    created_at?: Date;
    updated_at?: Date;
  }> {
    const cached = this.pageCache.get(slug);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const page = await this.pageContentRepo.findOne({
      where: { page_slug: slug },
    });
    const value = page
      ? {
          page_slug: page.page_slug,
          content: page.content,
          created_at: page.created_at,
          updated_at: page.updated_at,
        }
      : { page_slug: slug, content: slug === "landing" ? {} : "" };

    this.pageCache.set(slug, {
      value,
      expiresAt: Date.now() + PAGE_CACHE_TTL_MS,
    });
    return value;
  }

  async updatePageContent(slug: string, body: unknown): Promise<PageContent> {
    let payload: unknown = body;
    if (
      body &&
      typeof body === "object" &&
      !Array.isArray(body) &&
      Object.prototype.hasOwnProperty.call(body, "content") &&
      Object.keys(body as object).every((k) => k === "content")
    ) {
      payload = (body as { content: unknown }).content;
    }

    let page = await this.pageContentRepo.findOne({
      where: { page_slug: slug },
    });
    if (!page) {
      page = this.pageContentRepo.create({ page_slug: slug, content: payload });
    } else {
      page.content = payload;
    }
    const saved = await this.pageContentRepo.save(page);
    this.pageCache.delete(slug);
    return saved;
  }
}
