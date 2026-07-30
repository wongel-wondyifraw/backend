import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { MembersService } from './members.service';
import { Member } from './entities/member.entity';
import { NOTIFICATION_EVENT } from '../notifications/notification-events';

describe('MembersService', () => {
    let service: MembersService;
    let repository: jest.Mocked<Pick<Repository<Member>, 'create' | 'save' | 'findOne' | 'delete' | 'find' | 'createQueryBuilder'>>;
    let events: jest.Mocked<Pick<EventEmitter2, 'emit'>>;

    const member = {
        id: 'member-1',
        first_name: 'John',
        middle_name: '',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: undefined,
        image_url: undefined,
        address: undefined,
        date_of_birth: undefined,
        marital_status: undefined,
        status: 'active',
        baptized: false,
        created_at: new Date(),
        updated_at: new Date(),
        ministry_members: [],
    } as unknown as Member;

    beforeEach(() => {
        repository = {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
        };
        events = { emit: jest.fn() };

        service = new MembersService(
            repository as unknown as Repository<Member>,
            events as unknown as EventEmitter2,
        );
    });

    it('creates a member and emits notification event', async () => {
        repository.create.mockReturnValue(member);
        repository.save.mockResolvedValue(member);

        const result = await service.create({
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
        });

        expect(result).toEqual(member);
        expect(events.emit).toHaveBeenCalledWith(
            NOTIFICATION_EVENT,
            expect.objectContaining({
                eventName: 'member.created',
                targetRoles: ['admin', 'minister'],
            }),
        );
    });

    it('throws when member is not found', async () => {
        repository.findOne.mockResolvedValue(null);

        await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('returns paginated members', async () => {
        const qb = {
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([[member], 1]),
        };
        repository.createQueryBuilder.mockReturnValue(qb as never);

        const result = await service.findAllPaginated(1, 20, 'john');

        expect(result.data).toEqual([member]);
        expect(result.total).toBe(1);
        expect(result.page).toBe(1);
        expect(result.totalPages).toBe(1);
        expect(qb.where).toHaveBeenCalled();
    });

    it('deletes member and emits notification', async () => {
        repository.findOne.mockResolvedValue(member);
        repository.delete.mockResolvedValue({ affected: 1, raw: [] });

        await service.remove('member-1');

        expect(events.emit).toHaveBeenCalledWith(
            NOTIFICATION_EVENT,
            expect.objectContaining({ eventName: 'member.deleted' }),
        );
    });
});
