"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const nestjs_pino_1 = require("nestjs-pino");
const path_1 = require("path");
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    const config = app.get(config_1.ConfigService);
    const port = config.get('PORT', 3001);
    const frontendUrl = config.get('FRONTEND_URL', 'http://localhost:3000');
    const frontendUrls = (config.get('FRONTEND_URLS') || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    const allowedOrigins = new Set([frontendUrl, ...frontendUrls]);
    // 1. Logging: Use Pino instead of default console
    const logger = app.get(nestjs_pino_1.Logger);
    app.useLogger(logger);
    // Register Global Exception Filter
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter(logger));
    // 2. Security: Set security headers (MUST come before static assets)
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginEmbedderPolicy: false,
    }));
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true);
                return;
            }
            const isDevLocalhost = process.env.NODE_ENV !== 'production'
                && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
            let isVercelPreview = false;
            try {
                isVercelPreview = /\.vercel\.app$/.test(new URL(origin).hostname);
            }
            catch (_a) {
                isVercelPreview = false;
            }
            if (isDevLocalhost || isVercelPreview || allowedOrigins.has(origin)) {
                callback(null, true);
                return;
            }
            callback(null, false);
        },
        credentials: true,
    });
    // 3. Static Assets: Serve from project root (use process.cwd() for reliable pathing)
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/uploads',
        setHeaders: (res) => {
            res.set('Cross-Origin-Resource-Policy', 'cross-origin');
            res.set('Access-Control-Allow-Origin', frontendUrl);
        },
    });
    // 4. Scalability: Enable API Versioning (e.g., /v1/users)
    app.setGlobalPrefix('api');
    app.enableVersioning({
        type: common_1.VersioningType.URI,
        defaultVersion: '1',
    });
    // 5. Validation: Global sanitization of inputs
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('CMS API')
        .setDescription('Church Management System REST API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    await app.listen(port);
    logger.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
