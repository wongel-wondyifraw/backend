import "reflect-metadata";
import { DataSource } from "typeorm";
import { config as loadEnv } from "dotenv";
import { User } from "../modules/users/entities/user.entity";
import { Member } from "../modules/members/entities/member.entity";
import { Minister } from "../modules/ministers/entities/minister.entity";
import { Ministry } from "../modules/ministries/entities/ministry.entity";
import { MinistryMember } from "../modules/ministries/entities/ministry-member.entity";
import { HomeGroup } from "../modules/home-groups/entities/home-group.entity";
import { HomeGroupMember } from "../modules/home-groups/entities/home-group-member.entity";
import { BibleStudy } from "../modules/bible-studies/entities/bible-study.entity";
import { BibleStudyMember } from "../modules/bible-studies/entities/bible-study-member.entity";
import { Task } from "../modules/tasks/entities/task.entity";
import { TaskDefinition } from "../modules/tasks/entities/task-definition.entity";
import { Plan } from "../modules/plans/entities/plan.entity";
import { PlanMinister } from "../modules/plans/entities/plan-minister.entity";
import { Family } from "../modules/families/entities/family.entity";
import { FamilyChild } from "../modules/families/entities/family-child.entity";
import { Location } from "../modules/locations/entities/location.entity";
import { Notification } from "../modules/notifications/entities/notification.entity";
import { NotificationPreference } from "../modules/notifications/entities/notification-preference.entity";
import { AuditLog } from "../modules/audit-logs/entities/audit-log.entity";
import { PageContent } from "../modules/website/entities/page-content.entity";
import { ContactRequest } from "../modules/website/entities/contact-request.entity";
import { Role } from "../modules/access/entities/role.entity";
import { Permission } from "../modules/access/entities/permission.entity";

loadEnv();

const databaseUrl = process.env.DATABASE_URL;
const sslEnabled = process.env.DB_SSL === "true";

export default new DataSource({
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
    User,
    Member,
    Minister,
    Ministry,
    MinistryMember,
    HomeGroup,
    HomeGroupMember,
    BibleStudy,
    BibleStudyMember,
    Task,
    TaskDefinition,
    Plan,
    PlanMinister,
    Family,
    FamilyChild,
    Location,
    Notification,
    NotificationPreference,
    AuditLog,
    PageContent,
    ContactRequest,
    Role,
    Permission,
  ],
  migrations: [__dirname + "/migrations/*.{ts,js}"],
  synchronize: false,
});
