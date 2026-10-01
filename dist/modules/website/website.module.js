"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsiteModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const website_service_1 = require("./website.service");
const website_controller_1 = require("./website.controller");
const page_content_entity_1 = require("./entities/page-content.entity");
const contact_request_entity_1 = require("./entities/contact-request.entity");
const contact_requests_service_1 = require("./contact-requests.service");
const contact_requests_controller_1 = require("./contact-requests.controller");
let WebsiteModule = class WebsiteModule {
};
exports.WebsiteModule = WebsiteModule;
exports.WebsiteModule = WebsiteModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([page_content_entity_1.PageContent, contact_request_entity_1.ContactRequest])],
        controllers: [website_controller_1.WebsiteController, contact_requests_controller_1.ContactRequestsController],
        providers: [website_service_1.WebsiteService, contact_requests_service_1.ContactRequestsService],
        exports: [website_service_1.WebsiteService, contact_requests_service_1.ContactRequestsService],
    })
], WebsiteModule);
