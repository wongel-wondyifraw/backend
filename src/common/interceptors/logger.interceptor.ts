import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    constructor(private readonly logger: PinoLogger) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const { method, url } = request;
        const now = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    const response = ctx.getResponse();
                    const statusCode = response.statusCode;
                    const executionTime = Date.now() - now;
                    this.logger.info(
                        {
                            method,
                            url,
                            statusCode,
                            executionTime: `${executionTime}ms`,
                        },
                        `${method} ${url} ${statusCode} - ${executionTime}ms`
                    );
                },
                error: (error) => {
                    const executionTime = Date.now() - now;
                    const statusCode = error.status || 500;
                    this.logger.error(
                        {
                            method,
                            url,
                            statusCode,
                            executionTime: `${executionTime}ms`,
                            err: error,
                        },
                        `${method} ${url} ${statusCode} - ${executionTime}ms`
                    );
                },
            }),
        );
    }
}
