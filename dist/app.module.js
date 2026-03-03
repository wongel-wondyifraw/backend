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
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const nestjs_pino_1 = require("nestjs-pino");
const throttler_1 = require("@nestjs/throttler");
const users_module_1 = require("./modules/users/users.module");
const auth_module_1 = require("./modules/auth/auth.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
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
                            customProps: (req, res) => ({
                                context: 'HTTP',
                            }),
                        },
                    };
                },
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 10,
                },
            ]),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('DB_HOST'),
                    port: config.get('DB_PORT'),
                    username: config.get('DB_USERNAME'),
                    password: config.get('DB_PASSWORD'),
                    database: config.get('DB_NAME'),
                    autoLoadEntities: true,
                    synchronize: config.get('DB_SYNCHRONIZE') === 'true',
                }),
            }),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
