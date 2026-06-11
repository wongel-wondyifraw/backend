import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { join } from 'path';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        bufferLogs: true,
    });

    const config = app.get(ConfigService);
    const port = config.get<number>('PORT', 3001);
    const frontendUrl = config.get<string>('FRONTEND_URL', 'http://localhost:3000');

    // 1. Logging: Use Pino instead of default console
    const logger = app.get(Logger);
    app.useLogger(logger);

    // Register Global Exception Filter
    app.useGlobalFilters(new HttpExceptionFilter(logger));

    // 2. Security: Set security headers (MUST come before static assets)
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginEmbedderPolicy: false,
    }));

    app.enableCors({
        origin: frontendUrl,
        credentials: true,
    });

    // 3. Static Assets: Serve from project root (use process.cwd() for reliable pathing)
    app.useStaticAssets(join(process.cwd(), 'uploads'), {
        prefix: '/uploads',
        setHeaders: (res) => {
            res.set('Cross-Origin-Resource-Policy', 'cross-origin');
            res.set('Access-Control-Allow-Origin', frontendUrl);
        },
    });

    // 4. Scalability: Enable API Versioning (e.g., /v1/users)
    app.setGlobalPrefix('api');
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    // 5. Validation: Global sanitization of inputs
    // backend/src/main.ts - Update section 5

    // 5. Validation: Global sanitization of inputs
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true, // This allows @Transform to run
        forbidNonWhitelisted: true,
        transformOptions: {
            enableImplicitConversion: true, // Automatically converts primitives (numbers, booleans)
        },
    }));
    await app.listen(port);
    logger.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
