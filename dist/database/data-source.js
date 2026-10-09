"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const user_entity_1 = require("../modules/users/entities/user.entity");
const member_entity_1 = require("../modules/members/entities/member.entity");
const minister_entity_1 = require("../modules/ministers/entities/minister.entity");
const ministry_entity_1 = require("../modules/ministries/entities/ministry.entity");
const ministry_member_entity_1 = require("../modules/ministries/entities/ministry-member.entity");
const home_group_entity_1 = require("../modules/home-groups/entities/home-group.entity");
const home_group_member_entity_1 = require("../modules/home-groups/entities/home-group-member.entity");
const bible_study_entity_1 = require("../modules/bible-studies/entities/bible-study.entity");
const bible_study_member_entity_1 = require("../modules/bible-studies/entities/bible-study-member.entity");
const task_entity_1 = require("../modules/tasks/entities/task.entity");
const task_definition_entity_1 = require("../modules/tasks/entities/task-definition.entity");
const plan_entity_1 = require("../modules/plans/entities/plan.entity");
const plan_minister_entity_1 = require("../modules/plans/entities/plan-minister.entity");
const family_entity_1 = require("../modules/families/entities/family.entity");
const family_child_entity_1 = require("../modules/families/entities/family-child.entity");
const location_entity_1 = require("../modules/locations/entities/location.entity");
const notification_entity_1 = require("../modules/notifications/entities/notification.entity");
const notification_preference_entity_1 = require("../modules/notifications/entities/notification-preference.entity");
const audit_log_entity_1 = require("../modules/audit-logs/entities/audit-log.entity");
const page_content_entity_1 = require("../modules/website/entities/page-content.entity");
const contact_request_entity_1 = require("../modules/website/entities/contact-request.entity");
const role_entity_1 = require("../modules/access/entities/role.entity");
const permission_entity_1 = require("../modules/access/entities/permission.entity");
(0, dotenv_1.config)();
const databaseUrl = process.env.DATABASE_URL;
const sslEnabled = process.env.DB_SSL === "true";
exports.default = new typeorm_1.DataSource({
    type: "postgres",
    ...(databaseUrl
        ? { url: databaseUrl }
        : {
            host: process.env.DB_HOST || "localhost",
            port: Number(process.env.DB_PORT || 5432),
            username: process.env.DB_USERNAME || "postgres",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "Shepherd_one",
        }),
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    uuidExtension: "pgcrypto",
    entities: [
        user_entity_1.User,
        member_entity_1.Member,
        minister_entity_1.Minister,
        ministry_entity_1.Ministry,
        ministry_member_entity_1.MinistryMember,
        home_group_entity_1.HomeGroup,
        home_group_member_entity_1.HomeGroupMember,
        bible_study_entity_1.BibleStudy,
        bible_study_member_entity_1.BibleStudyMember,
        task_entity_1.Task,
        task_definition_entity_1.TaskDefinition,
        plan_entity_1.Plan,
        plan_minister_entity_1.PlanMinister,
        family_entity_1.Family,
        family_child_entity_1.FamilyChild,
        location_entity_1.Location,
        notification_entity_1.Notification,
        notification_preference_entity_1.NotificationPreference,
        audit_log_entity_1.AuditLog,
        page_content_entity_1.PageContent,
        contact_request_entity_1.ContactRequest,
        role_entity_1.Role,
        permission_entity_1.Permission,
    ],
    migrations: [__dirname + "/migrations/*.{ts,js}"],
    synchronize: false,
});
