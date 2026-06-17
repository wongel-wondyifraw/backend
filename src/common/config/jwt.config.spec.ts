import { ConfigService } from '@nestjs/config';
import { resolveJwtSecret } from './jwt.config';

describe('resolveJwtSecret', () => {
    function mockConfig(values: Record<string, string | undefined>): ConfigService {
        return {
            get: (key: string) => values[key],
        } as ConfigService;
    }

    it('returns configured secret when set', () => {
        const secret = resolveJwtSecret(mockConfig({ JWT_SECRET: 'my-secret', NODE_ENV: 'development' }));
        expect(secret).toBe('my-secret');
    });

    it('uses dev fallback when secret is missing in non-production', () => {
        const secret = resolveJwtSecret(mockConfig({ NODE_ENV: 'development' }));
        expect(secret).toBe('dev-only-insecure-secret');
    });

    it('throws when secret is missing in production', () => {
        expect(() =>
            resolveJwtSecret(mockConfig({ NODE_ENV: 'production' })),
        ).toThrow('JWT_SECRET environment variable is required in production');
    });

    it('throws when secret is blank in production', () => {
        expect(() =>
            resolveJwtSecret(mockConfig({ JWT_SECRET: '   ', NODE_ENV: 'production' })),
        ).toThrow('JWT_SECRET environment variable is required in production');
    });
});
