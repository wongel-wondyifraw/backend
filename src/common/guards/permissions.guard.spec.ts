import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { User } from '../../modules/users/entities/user.entity';
import { Permission } from '../../modules/access/entities/permission.entity';
import { Role } from '../../modules/access/entities/role.entity';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  function createContext(user?: Partial<User>): ExecutionContext {
    const roleEntity = {
      key: 'minister',
      permissions: [{ slug: 'members.read' } as Permission],
    } as Role;

    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: user !== undefined ? { roleEntity, ...user } : undefined,
        }),
      }),
    } as ExecutionContext;
  }

  it('allows when no permissions required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows when user has required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['members.read']);
    expect(guard.canActivate(createContext({}))).toBe(true);
  });

  it('throws when user lacks permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users.manage']);
    expect(() => guard.canActivate(createContext({}))).toThrow(ForbiddenException);
  });
});
