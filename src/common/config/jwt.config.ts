import { ConfigService } from '@nestjs/config';

const DEV_FALLBACK_SECRET = 'dev-only-insecure-secret';

export function resolveJwtSecret(config: ConfigService): string {
    const secret = config.get<string>('JWT_SECRET')?.trim();
    const isProduction = config.get<string>('NODE_ENV') === 'production';

    if (!secret) {
        if (isProduction) {
            throw new Error('JWT_SECRET environment variable is required in production');
        }
        return DEV_FALLBACK_SECRET;
    }

    return secret;
}
