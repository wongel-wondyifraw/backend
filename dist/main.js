"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const nestjs_pino_1 = require("nestjs-pino");
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const multer_config_1 = require("./common/config/multer.config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    const config = app.get(config_1.ConfigService);
    const port = config.get("PORT", 3001);
    const frontendUrl = config.get("FRONTEND_URL", "http://localhost:3000");
    const frontendUrls = (config.get("FRONTEND_URLS") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    const allowedOrigins = new Set([frontendUrl, ...frontendUrls]);
    const isAllowedOrigin = (origin) => {
        if (allowedOrigins.has(origin))
            return true;
        const isDevLocalhost = process.env.NODE_ENV !== "production" &&
            /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        try {
            if (/\.vercel\.app$/.test(new URL(origin).hostname))
                return true;
        }
        catch (_a) {
            /* keep false */
        }
        return isDevLocalhost;
    };
    // 1. Logging: Use Pino instead of default console
    const logger = app.get(nestjs_pino_1.Logger);
    app.useLogger(logger);
    // Register Global Exception Filter
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter(logger));
    // 2. Security: Set security headers (MUST come before static assets)
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginEmbedderPolicy: false,
    }));
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true);
                return;
            }
            if (isAllowedOrigin(origin)) {
                callback(null, true);
                return;
            }
            callback(null, false);
        },
        credentials: true,
    });
    // 3. Static Assets: local uploads/ (override with UPLOADS_DIR)
    (0, multer_config_1.ensureUploadDirs)();
    app.useStaticAssets((0, multer_config_1.getUploadsRoot)(), {
        prefix: "/uploads",
        setHeaders: (res) => {
            var _a, _b;
            res.set("Cross-Origin-Resource-Policy", "cross-origin");
            res.set("Cache-Control", "public, max-age=31536000, immutable");
            const origin = (_b = (_a = res.req) === null || _a === void 0 ? void 0 : _a.headers) === null || _b === void 0 ? void 0 : _b.origin;
            if (typeof origin === "string" && isAllowedOrigin(origin)) {
                res.set("Access-Control-Allow-Origin", origin);
            }
            else {
                res.set("Access-Control-Allow-Origin", frontendUrl);
            }
        },
    });
    // 4. Scalability: Enable API Versioning (e.g., /v1/users)
    app.setGlobalPrefix("api");
    app.enableVersioning({
        type: common_1.VersioningType.URI,
        defaultVersion: "1",
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
        .setTitle("CMS API")
        .setDescription("Church Management System REST API")
        .setVersion("1.0")
        .addBearerAuth()
        .build();
    // Skip Swagger in production — saves heap on small (512MB) hosts
    if (config.get("NODE_ENV") !== "production") {
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup("api/docs", app, document);
    }
    await app.listen(port);
    logger.log(`Backend running on http://localhost:${port}`);
}
void bootstrap();
