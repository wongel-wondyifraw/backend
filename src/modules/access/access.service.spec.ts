import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AccessService } from './access.service';
import { AccessSeederService } from './access.seeder.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { User } from '../users/entities/user.entity';
import { SYSTEM_ROLE_ADMIN_KEY } from './access.types';

describe('AccessService', () => {
    let service: AccessService;
    let roles: jest.Mocked<Pick<Repository<Role>, 'find' | 'findOne' | 'create' | 'save' | 'remove'>>;
    let permissions: jest.Mocked<Pick<Repository<Permission>, 'createQueryBuilder'>>;
    let users: jest.Mocked<Pick<Repository<User>, 'count'>>;
    let seeder: jest.Mocked<Pick<AccessSeederService, 'findAllPermissions' | 'findRoleByKey'>>;

    const adminRole: Role = {
        id: 'role-admin',
        key: SYSTEM_ROLE_ADMIN_KEY,
        name: 'Administrator',
        description: null,
        is_system: true,
        permissions: [{ slug: 'users.manage' } as Permission],
        users: [],
        created_at: new Date(),
        updated_at: new Date(),
    };

    beforeEach(() => {
        roles = {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
        };
        permissions = {
            createQueryBuilder: jest.fn(),
        };
        users = { count: jest.fn() };
        seeder = {
            findAllPermissions: jest.fn(),
            findRoleByKey: jest.fn(),
        };

        service = new AccessService(
            roles as unknown as Repository<Role>,
            permissions as unknown as Repository<Permission>,
            users as unknown as Repository<User>,
            seeder as unknown as AccessSeederService,
        );
    });

    it('throws when creating a role with duplicate key', async () => {
        roles.findOne.mockResolvedValue({ id: 'existing' } as Role);

        await expect(
            service.createRole({
                key: 'custom',
                name: 'Custom',
                permissionSlugs: [],
            }),
        ).rejects.toThrow(ConflictException);
    });

    it('throws when deleting a system role', async () => {
        roles.findOne.mockResolvedValue(adminRole);

        await expect(service.removeRole('role-admin')).rejects.toThrow(BadRequestException);
    });

    it('throws when deleting a role assigned to users', async () => {
        roles.findOne.mockResolvedValue({
            ...adminRole,
            key: 'custom',
            is_system: false,
        });
        users.count.mockResolvedValue(2);

        await expect(service.removeRole('role-custom')).rejects.toThrow(ConflictException);
    });

    it('throws when permission slugs are unknown', async () => {
        roles.findOne.mockResolvedValue({
            ...adminRole,
            key: 'custom',
            is_system: false,
        });

        const qb = {
            where: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
        };
        permissions.createQueryBuilder.mockReturnValue(qb as never);

        await expect(
            service.updateRole('role-custom', { permissionSlugs: ['missing.permission'] }),
        ).rejects.toThrow(NotFoundException);
    });

    it('lists permissions grouped by category', async () => {
        seeder.findAllPermissions.mockResolvedValue([
            { slug: 'members.read', name: 'Read members', category: 'Members' } as Permission,
            { slug: 'users.read', name: 'Read users', category: 'Users' } as Permission,
        ]);

        const grouped = await service.listPermissionsGrouped();

        expect(grouped.Members).toHaveLength(1);
        expect(grouped.Users).toHaveLength(1);
    });
});
