import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { VersioningType, ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Logger } from "nestjs-pino";
import { join } from "path";
import helmet from "helmet";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(ConfigService);
  const port = config.get<number>("PORT", 3001);
  const frontendUrl = config.get<string>(
    "FRONTEND_URL",
    "http://localhost:3000",
  );
  const frontendUrls = (config.get<string>("FRONTEND_URLS") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedOrigins = new Set([frontendUrl, ...frontendUrls]);

  // 1. Logging: Use Pino instead of default console
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Register Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // 2. Security: Set security headers (MUST come before static assets)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isDevLocalhost =
        process.env.NODE_ENV !== "production" &&
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      let isVercelPreview = false;
      try {
        isVercelPreview = /\.vercel\.app$/.test(new URL(origin).hostname);
      } catch {
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
  app.useStaticAssets(join(process.cwd(), "uploads"), {
    prefix: "/uploads",
    setHeaders: (res) => {
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      res.set("Access-Control-Allow-Origin", frontendUrl);
    },
  });

  // 4. Scalability: Enable API Versioning (e.g., /v1/users)
  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  // 5. Validation: Global sanitization of inputs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("CMS API")
    .setDescription("Church Management System REST API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  // Skip Swagger in production — saves heap on small (512MB) hosts
  if (config.get<string>("NODE_ENV") !== "production") {
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document);
  }

  await app.listen(port);
  logger.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
