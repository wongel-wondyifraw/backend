import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerModule } from "nestjs-pino";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./modules/auth/auth.module";
import { MembersModule } from "./modules/members/members.module";
import { MinistersModule } from "./modules/ministers/ministers.module";
import { MinistriesModule } from "./modules/ministries/ministries.module";
import { HomeGroupsModule } from "./modules/home-groups/home-groups.module";
import { BibleStudiesModule } from "./modules/bible-studies/bible-studies.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { PlansModule } from "./modules/plans/plans.module";
import { FamiliesModule } from "./modules/families/families.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { AccessModule } from "./modules/access/access.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { LocationsModule } from "./modules/locations/locations.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { WebsiteModule } from "./modules/website/website.module";
import { HealthModule } from "./modules/health/health.module";
import { AdminSeedService } from "./database/admin-seed.service";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get("NODE_ENV") === "production";
        return {
          pinoHttp: {
            autoLogging: true,
            quietReqLogger: true,
            level: isProduction ? "info" : "debug",
            transport: isProduction
              ? undefined
              : {
                  target: "pino-pretty",
                  options: {
                    colorize: true,
                    singleLine: false,
                    translateTime: "SYS:HH:MM:ss",
                    ignore:
                      "req.headers,res.headers,req.remoteAddress,req.remotePort",
                  },
                },
            serializers: {
              req: (req) => {
                const sanitizedBody = req.raw.body
                  ? { ...req.raw.body }
                  : undefined;
                if (sanitizedBody) {
                  if (sanitizedBody.password) sanitizedBody.password = "***";
                  if (sanitizedBody.token) sanitizedBody.token = "***";
                  if (sanitizedBody.currentPassword)
                    sanitizedBody.currentPassword = "[REDACTED]";
                  if (sanitizedBody.newPassword)
                    sanitizedBody.newPassword = "[REDACTED]";
                }
                return {
                  id: req.id,
                  method: req.method,
                  url: req.url,
                  body: sanitizedBody,
                };
              },
              res: (res) => ({
                statusCode: res.statusCode,
              }),
            },
            customProps: () => ({
              context: "HTTP",
            }),
          },
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>("DATABASE_URL");
        const sslEnabled = config.get<string>("DB_SSL") === "true";

        return {
          type: "postgres",
          ...(databaseUrl
            ? {
                url: databaseUrl,
              }
            : {
                host: config.get<string>("DB_HOST"),
                port: Number(config.get<string>("DB_PORT") || 5432),
                username: config.get<string>("DB_USERNAME"),
                password: config.get<string>("DB_PASSWORD"),
                database: config.get<string>("DB_NAME"),
              }),
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
          autoLoadEntities: true,
          synchronize: config.get<string>("DB_SYNCHRONIZE") === "true",
        };
      },
    }),
    AccessModule,
    UsersModule,
    AuthModule,
    MembersModule,
    MinistersModule,
    MinistriesModule,
    HomeGroupsModule,
    BibleStudiesModule,
    TasksModule,
    PlansModule,
    FamiliesModule,
    DashboardModule,
    NotificationsModule,
    UploadsModule,
    LocationsModule,
    AuditLogsModule,
    WebsiteModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    AdminSeedService,
    JwtAuthGuard,
    PermissionsGuard,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
