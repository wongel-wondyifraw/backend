import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebsiteService } from './website.service';
import { WebsiteController } from './website.controller';
import { PageContent } from './entities/page-content.entity';
import { CommunityProject } from './entities/community-project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PageContent, CommunityProject])],
  controllers: [WebsiteController],
  providers: [WebsiteService],
})
export class WebsiteModule {}
