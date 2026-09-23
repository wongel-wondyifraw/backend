"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const nestjs_pino_1 = require("nestjs-pino");
const event_emitter_1 = require("@nestjs/event-emitter");
const users_module_1 = require("./modules/users/users.module");
const auth_module_1 = require("./modules/auth/auth.module");
const members_module_1 = require("./modules/members/members.module");
const ministers_module_1 = require("./modules/ministers/ministers.module");
const ministries_module_1 = require("./modules/ministries/ministries.module");
const home_groups_module_1 = require("./modules/home-groups/home-groups.module");
const bible_studies_module_1 = require("./modules/bible-studies/bible-studies.module");
const tasks_module_1 = require("./modules/tasks/tasks.module");
const plans_module_1 = require("./modules/plans/plans.module");
const families_module_1 = require("./modules/families/families.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const access_module_1 = require("./modules/access/access.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const uploads_module_1 = require("./modules/uploads/uploads.module");
const locations_module_1 = require("./modules/locations/locations.module");
const audit_logs_module_1 = require("./modules/audit-logs/audit-logs.module");
const website_module_1 = require("./modules/website/website.module");
const health_module_1 = require("./modules/health/health.module");
const admin_seed_service_1 = require("./database/admin-seed.service");
const jwt_auth_guard_1 = require("./modules/auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("./common/guards/permissions.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            event_emitter_1.EventEmitterModule.forRoot(),
            nestjs_pino_1.LoggerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const isProduction = config.get('NODE_ENV') === 'production';
                    return {
                        pinoHttp: {
                            autoLogging: true,
                            quietReqLogger: true,
                            level: isProduction ? 'info' : 'debug',
                            transport: isProduction
                                ? undefined
                                : {
                                    target: 'pino-pretty',
                                    options: {
                                        colorize: true,
                                        singleLine: false,
                                        translateTime: 'SYS:HH:MM:ss',
                                        ignore: 'req.headers,res.headers,req.remoteAddress,req.remotePort',
                                    },
                                },
                            serializers: {
                                req: (req) => {
                                    const sanitizedBody = req.raw.body ? { ...req.raw.body } : undefined;
                                    if (sanitizedBody) {
                                        if (sanitizedBody.password)
                                            sanitizedBody.password = '***';
                                        if (sanitizedBody.token)
                                            sanitizedBody.token = '***';
                                        if (sanitizedBody.currentPassword)
                                            sanitizedBody.currentPassword = '[REDACTED]';
                                        if (sanitizedBody.newPassword)
                                            sanitizedBody.newPassword = '[REDACTED]';
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
                                context: 'HTTP',
                            }),
                        },
                    };
                },
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const databaseUrl = config.get('DATABASE_URL');
                    const sslEnabled = config.get('DB_SSL') === 'true';
                    return {
                        type: 'postgres',
                        ...(databaseUrl
                            ? {
                                url: databaseUrl,
                            }
                            : {
                                host: config.get('DB_HOST'),
                                port: Number(config.get('DB_PORT') || 5432),
                                username: config.get('DB_USERNAME'),
                                password: config.get('DB_PASSWORD'),
                                database: config.get('DB_NAME'),
                            }),
                        ssl: sslEnabled ? { rejectUnauthorized: false } : false,
                        autoLoadEntities: true,
                        synchronize: config.get('DB_SYNCHRONIZE') === 'true',
                    };
                },
            }),
            access_module_1.AccessModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            members_module_1.MembersModule,
            ministers_module_1.MinistersModule,
            ministries_module_1.MinistriesModule,
            home_groups_module_1.HomeGroupsModule,
            bible_studies_module_1.BibleStudiesModule,
            tasks_module_1.TasksModule,
            plans_module_1.PlansModule,
            families_module_1.FamiliesModule,
            dashboard_module_1.DashboardModule,
            notifications_module_1.NotificationsModule,
            uploads_module_1.UploadsModule,
            locations_module_1.LocationsModule,
            audit_logs_module_1.AuditLogsModule,
            website_module_1.WebsiteModule,
            health_module_1.HealthModule,
        ],
        controllers: [],
        providers: [
            admin_seed_service_1.AdminSeedService,
            jwt_auth_guard_1.JwtAuthGuard,
            permissions_guard_1.PermissionsGuard,
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: permissions_guard_1.PermissionsGuard },
        ],
    })
], AppModule);
