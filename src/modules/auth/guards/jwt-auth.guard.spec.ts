import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;
    let reflector: Reflector;

    beforeEach(() => {
        reflector = new Reflector();
        guard = new JwtAuthGuard(reflector);
    });

    function createContext(): ExecutionContext {
        return {
            getHandler: () => ({}),
            getClass: () => ({}),
            switchToHttp: () => ({
                getRequest: () => ({}),
            }),
        } as ExecutionContext;
    }

    it('allows public routes without invoking passport', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
        const superSpy = jest.spyOn(AuthGuard('jwt').prototype, 'canActivate');

        expect(guard.canActivate(createContext())).toBe(true);
        expect(superSpy).not.toHaveBeenCalled();
    });

    it('delegates to passport for protected routes', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
        const superSpy = jest
            .spyOn(AuthGuard('jwt').prototype, 'canActivate')
            .mockReturnValue(true as never);

        guard.canActivate(createContext());

        expect(superSpy).toHaveBeenCalled();
    });
});
