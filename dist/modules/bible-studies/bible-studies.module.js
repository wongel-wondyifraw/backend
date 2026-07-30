"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BibleStudiesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bible_studies_service_1 = require("./bible-studies.service");
const bible_studies_controller_1 = require("./bible-studies.controller");
const bible_study_entity_1 = require("./entities/bible-study.entity");
const bible_study_member_entity_1 = require("./entities/bible-study-member.entity");
const leadership_module_1 = require("../../common/leadership/leadership.module");
let BibleStudiesModule = class BibleStudiesModule {
};
exports.BibleStudiesModule = BibleStudiesModule;
exports.BibleStudiesModule = BibleStudiesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([bible_study_entity_1.BibleStudy, bible_study_member_entity_1.BibleStudyMember]), leadership_module_1.LeadershipModule],
        controllers: [bible_studies_controller_1.BibleStudiesController],
        providers: [bible_studies_service_1.BibleStudiesService],
        exports: [bible_studies_service_1.BibleStudiesService],
    })
], BibleStudiesModule);
