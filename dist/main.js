"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const nestjs_pino_1 = require("nestjs-pino");
const path_1 = require("path");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
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
        origin: 'http://localhost:5173', // Your frontend URL
        credentials: true,
    });
    // 3. Static Assets: Serve from project root (use process.cwd() for reliable pathing)
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/uploads',
        setHeaders: (res) => {
            res.set('Cross-Origin-Resource-Policy', 'cross-origin');
            res.set('Access-Control-Allow-Origin', 'http://localhost:5173');
        },
    });
    // 4. Scalability: Enable API Versioning (e.g., /v1/users)
    app.setGlobalPrefix('api');
    app.enableVersioning({
        type: common_1.VersioningType.URI,
        defaultVersion: '1',
    });
    // 5. Validation: Global sanitization of inputs
    // backend/src/main.ts - Update section 5
    // 5. Validation: Global sanitization of inputs
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true, // This allows @Transform to run
        forbidNonWhitelisted: true,
        transformOptions: {
            enableImplicitConversion: true, // Automatically converts primitives (numbers, booleans)
        },
    }));
    await app.listen(3000);
}
bootstrap();
