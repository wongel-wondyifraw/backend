import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WebsiteService } from "./website.service";
import { WebsiteController } from "./website.controller";
import { PageContent } from "./entities/page-content.entity";
import { ContactRequest } from "./entities/contact-request.entity";
import { ContactRequestsService } from "./contact-requests.service";
import { ContactRequestsController } from "./contact-requests.controller";

@Module({
  imports: [TypeOrmModule.forFeature([PageContent, ContactRequest])],
  controllers: [WebsiteController, ContactRequestsController],
  providers: [WebsiteService, ContactRequestsService],
  exports: [WebsiteService, ContactRequestsService],
})
export class WebsiteModule {}
