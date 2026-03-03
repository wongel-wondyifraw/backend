import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule } from '@nestjs/throttler';
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
                        level: isProduction ? 'info' : 'debug',
                        transport: isProduction
                            ? undefined
                            : {
                                target: 'pino-pretty',
                                options: {
                                    singleLine: true,
                                },
                            },
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
        UsersModule,
        AuthModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
