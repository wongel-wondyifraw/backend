import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageContent } from './entities/page-content.entity';
import { CommunityProject } from './entities/community-project.entity';

@Injectable()
export class WebsiteService {
  constructor(
    @InjectRepository(PageContent)
    private readonly pageContentRepo: Repository<PageContent>,
    @InjectRepository(CommunityProject)
    private readonly communityProjectRepo: Repository<CommunityProject>,
  ) {}

  // Page Content Methods
  async getPageContent(slug: string): Promise<any> {
    const page = await this.pageContentRepo.findOne({ where: { page_slug: slug } });
    if (!page) {
      // Return default empty content if not found
      return { page_slug: slug, content: {} };
    }
    return page;
  }

  async updatePageContent(slug: string, content: any): Promise<PageContent> {
    let page = await this.pageContentRepo.findOne({ where: { page_slug: slug } });
    if (!page) {
      page = this.pageContentRepo.create({ page_slug: slug, content });
    } else {
      page.content = content;
    }
    return this.pageContentRepo.save(page);
  }

  // Community Project Methods
  async getProjects(status?: string): Promise<CommunityProject[]> {
    if (status) {
      return this.communityProjectRepo.find({ where: { status }, order: { created_at: 'DESC' } });
    }
    return this.communityProjectRepo.find({ order: { created_at: 'DESC' } });
  }

  async getProject(id: string): Promise<CommunityProject> {
    const project = await this.communityProjectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async createProject(data: Partial<CommunityProject>): Promise<CommunityProject> {
    const project = this.communityProjectRepo.create(data);
    return this.communityProjectRepo.save(project);
  }

  async updateProject(id: string, data: Partial<CommunityProject>): Promise<CommunityProject> {
    await this.communityProjectRepo.update(id, data);
    return this.getProject(id);
  }

  async deleteProject(id: string): Promise<void> {
    const result = await this.communityProjectRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Project not found');
  }
}
