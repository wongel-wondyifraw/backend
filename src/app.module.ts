import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        LoggerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const isProduction = config.get('NODE_ENV') === 'production';
                return {
                    pinoHttp: {
                        autoLogging: true, // Ensure autologging is enabled for the middleware
                        quietReqLogger: true, // Suppress the 'PinoLogger is marked as a scoped provider' warning if possible
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
                                    if (sanitizedBody.password) sanitizedBody.password = '***';
                                    if (sanitizedBody.token) sanitizedBody.token = '***';
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
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 10,
            },
        ]),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.get<string>('DB_HOST'),
                port: config.get<number>('DB_PORT'),
                username: config.get<string>('DB_USERNAME'),
                password: config.get<string>('DB_PASSWORD'),
                database: config.get<string>('DB_NAME'),
                autoLoadEntities: true,
                synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true', // True for initial dev, false otherwise
            }),
        }),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'uploads'),
            serveRoot: '/uploads',
        }),
        UsersModule,
        AuthModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
