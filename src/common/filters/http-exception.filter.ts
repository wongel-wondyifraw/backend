import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: Logger) {
        // We use the singleton Logger to avoid scope issues
    }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse =
            exception instanceof HttpException
                ? exception.getResponse()
                : { message: 'An unexpected error occurred' };

        const message = typeof exceptionResponse === 'object'
            ? (exceptionResponse as any).message || 'An unexpected error occurred'
            : exceptionResponse;

        const userId = (request as any).user?.id || 'anonymous';

        // Sanitize body for logging
        let sanitizedBody = undefined;
        if (['POST', 'PATCH', 'PUT'].includes(request.method) && request.body) {
            sanitizedBody = { ...request.body };
            if (sanitizedBody.password) sanitizedBody.password = '***';
            if (sanitizedBody.token) sanitizedBody.token = '***';
        }

        const is500 = status === HttpStatus.INTERNAL_SERVER_ERROR;
        const isDev = process.env.NODE_ENV !== 'production';

        const errorDetails: any = {
            method: request.method,
            url: request.url,
            userId,
            statusCode: status,
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
            exception instanceof Error ? exception.message : 'Internal Server Error'
        );

        response.status(status).json({
            statusCode: status,
            message: is500 ? 'An unexpected error occurred' : message,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}
