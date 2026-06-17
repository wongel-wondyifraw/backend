"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveJwtSecret = resolveJwtSecret;
const DEV_FALLBACK_SECRET = 'dev-only-insecure-secret';
function resolveJwtSecret(config) {
    var _a;
    const secret = (_a = config.get('JWT_SECRET')) === null || _a === void 0 ? void 0 : _a.trim();
    const isProduction = config.get('NODE_ENV') === 'production';
    if (!secret) {
        if (isProduction) {
            throw new Error('JWT_SECRET environment variable is required in production');
        }
        return DEV_FALLBACK_SECRET;
    }
    return secret;
}
