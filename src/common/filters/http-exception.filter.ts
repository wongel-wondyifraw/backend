import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Logger } from "nestjs-pino";

type ExceptionBody = {
  message?: string | string[];
  code?: string;
  [key: string]: unknown;
};

type AuthenticatedRequest = Request & {
  user?: { id?: string };
  id?: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {
    // We use the singleton Logger to avoid scope issues
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuthenticatedRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse: string | ExceptionBody =
      exception instanceof HttpException
        ? (exception.getResponse() as string | ExceptionBody)
        : { message: "An unexpected error occurred" };

    const message =
      typeof exceptionResponse === "object"
        ? exceptionResponse.message || "An unexpected error occurred"
        : exceptionResponse;

    const userId = request.user?.id || "anonymous";

    // Sanitize body for logging
    let sanitizedBody: Record<string, unknown> | undefined;
    if (["POST", "PATCH", "PUT"].includes(request.method) && request.body) {
      sanitizedBody = { ...(request.body as Record<string, unknown>) };
      if (sanitizedBody.password) sanitizedBody.password = "***";
      if (sanitizedBody.token) sanitizedBody.token = "***";
    }

    const is500 = status === HttpStatus.INTERNAL_SERVER_ERROR;
    const isDev = process.env.NODE_ENV !== "production";

    const requestId =
      request.id ||
      (typeof request.headers["x-request-id"] === "string"
        ? request.headers["x-request-id"]
        : "unknown");
    const errorCode =
      typeof exceptionResponse === "object"
        ? exceptionResponse.code
        : undefined;

    const errorDetails: Record<string, unknown> = {
      method: request.method,
      url: request.url,
      userId,
      statusCode: status,
      requestId,
      code: errorCode,
    };

    if (is500) {
      if (sanitizedBody) {
        errorDetails.body = sanitizedBody;
      }
      if (isDev && exception instanceof Error) {
        errorDetails.stack = exception.stack;
      }
    }

    // Log using Pino
    this.logger.error(
      errorDetails,
      exception instanceof Error ? exception.message : "Internal Server Error",
    );

    response.status(status).json({
      statusCode: status,
      message: is500 ? "An unexpected error occurred" : message,
      code: errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    });
  }
}
