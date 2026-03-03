import { NestFactory } from '@nestjs/core';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bufferLogs: true,
    });

    // 1. Logging: Use Pino instead of default console
    const logger = app.get(Logger);
    app.useLogger(logger);

    // Register Global Exception Filter
    // Using singleton Logger instead of PinoLogger to avoid InvalidClassScopeException
    app.useGlobalFilters(new HttpExceptionFilter(logger));

    // 2. Security: Set security headers
    app.use(helmet());
    app.enableCors({
        origin: 'http://localhost:5173', // Your frontend URL
        credentials: true,
    });

    // 3. Scalability: Enable API Versioning (e.g., /v1/users)
    app.setGlobalPrefix('api');
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    // 4. Validation: Global sanitization of inputs
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));

    await app.listen(3000);
}
bootstrap();
