import { NestFactory } from '@nestjs/core';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });

    // 1. Logging: Use Pino instead of default console
    app.useLogger(app.get(Logger));

    // 2. Security: Set security headers
    app.use(helmet());

    // 3. Scalability: Enable API Versioning (e.g., /v1/users)
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
