"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const permissions_guard_1 = require("./permissions.guard");
describe('PermissionsGuard', () => {
    let guard;
    let reflector;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [permissions_guard_1.PermissionsGuard, core_1.Reflector],
        }).compile();
        guard = module.get(permissions_guard_1.PermissionsGuard);
        reflector = module.get(core_1.Reflector);
    });
    function createContext(user) {
        const roleEntity = {
            key: 'minister',
            permissions: [{ slug: 'members.read' }],
        };
        return {
            getHandler: () => ({}),
            getClass: () => ({}),
            switchToHttp: () => ({
                getRequest: () => ({
                    user: user ? { roleEntity, ...user } : undefined,
                }),
            }),
        };
    }
    it('allows when no permissions required', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
        expect(guard.canActivate(createContext())).toBe(true);
    });
    it('allows when user has required permission', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['members.read']);
        expect(guard.canActivate(createContext())).toBe(true);
    });
    it('throws when user lacks permission', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users.manage']);
        expect(() => guard.canActivate(createContext())).toThrow(common_1.ForbiddenException);
    });
});
