"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const nestjs_pino_1 = require("nestjs-pino");
let HttpExceptionFilter = class HttpExceptionFilter {
    constructor(logger) {
        this.logger = logger;
        // We use the singleton Logger to avoid scope issues
    }
    catch(exception, host) {
        var _a;
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const exceptionResponse = exception instanceof common_1.HttpException
            ? exception.getResponse()
            : { message: "An unexpected error occurred" };
        const message = typeof exceptionResponse === "object"
            ? exceptionResponse.message || "An unexpected error occurred"
            : exceptionResponse;
        const userId = ((_a = request.user) === null || _a === void 0 ? void 0 : _a.id) || "anonymous";
        // Sanitize body for logging
        let sanitizedBody;
        if (["POST", "PATCH", "PUT"].includes(request.method) && request.body) {
            sanitizedBody = { ...request.body };
            if (sanitizedBody.password)
                sanitizedBody.password = "***";
            if (sanitizedBody.token)
                sanitizedBody.token = "***";
        }
        const is500 = status === common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const isDev = process.env.NODE_ENV !== "production";
        const requestId = request.id ||
            (typeof request.headers["x-request-id"] === "string"
                ? request.headers["x-request-id"]
                : "unknown");
        const errorCode = typeof exceptionResponse === "object" ? exceptionResponse.code : undefined;
        const errorDetails = {
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
        this.logger.error(errorDetails, exception instanceof Error ? exception.message : "Internal Server Error");
        response.status(status).json({
            statusCode: status,
            message: is500 ? "An unexpected error occurred" : message,
            code: errorCode,
            timestamp: new Date().toISOString(),
            path: request.url,
            requestId,
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [nestjs_pino_1.Logger])
], HttpExceptionFilter);
