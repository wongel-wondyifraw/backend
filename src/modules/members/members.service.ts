import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Member } from './entities/member.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { NOTIFICATION_EVENT } from '../notifications/notification-events';

@Injectable()
export class MembersService {
    constructor(
        @InjectRepository(Member)
        private readonly membersRepository: Repository<Member>,
        private readonly events: EventEmitter2,
    ) { }

    async create(createMemberDto: CreateMemberDto): Promise<Member> {
        const member = this.membersRepository.create(createMemberDto);
        const saved = await this.membersRepository.save(member);
        const name = `${saved.first_name} ${saved.last_name}`.trim();
        this.events.emit(NOTIFICATION_EVENT, {
            eventName: 'member.created',
            kind: 'member',
            severity: 'success',
            title: 'New member added',
            message: `${name} was added to the directory.`,
            href: `/members/${saved.id}`,
            dedupeKey: `member.created:${saved.id}`,
            targetRoles: ['admin', 'minister'],
        });
        return saved;
    }

    async findAllPaginated(page = 1, limit = 20, search?: string): Promise<PaginatedResult<Member>> {
        const qb = this.membersRepository.createQueryBuilder('member');

        if (search?.trim()) {
            const pattern = `%${search.trim().toLowerCase()}%`;
            qb.where(
                'LOWER(member.first_name) LIKE :pattern OR LOWER(member.last_name) LIKE :pattern OR LOWER(member.email) LIKE :pattern OR member.phone LIKE :pattern OR LOWER(member.address) LIKE :pattern',
                { pattern },
            );
        }

        qb.orderBy('member.created_at', 'DESC');
        qb.skip((page - 1) * limit).take(limit);

        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }

    async findAll(): Promise<Member[]> {
        return this.membersRepository.find({
            order: { created_at: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Member> {
        const member = await this.membersRepository.findOne({ where: { id } });
        if (!member) {
            throw new NotFoundException(`Member with ID ${id} not found`);
        }
        return member;
    }

    async update(id: string, updateMemberDto: UpdateMemberDto): Promise<Member> {
        await this.membersRepository.update(id, updateMemberDto);
        const member = await this.findOne(id);
        const name = `${member.first_name} ${member.last_name}`.trim();
        this.events.emit(NOTIFICATION_EVENT, {
            eventName: 'member.updated',
            kind: 'member',
            severity: 'info',
            title: 'Member updated',
            message: `${name}'s profile was updated.`,
            href: `/members/${id}`,
            dedupeKey: `member.updated:${id}:${Date.now()}`,
            targetRoles: ['admin', 'minister'],
        });
        return member;
    }

    async remove(id: string): Promise<void> {
        const member = await this.membersRepository.findOne({ where: { id } });
        const result = await this.membersRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Member with ID ${id} not found`);
        }
        if (member) {
            const name = `${member.first_name} ${member.last_name}`.trim();
            this.events.emit(NOTIFICATION_EVENT, {
                eventName: 'member.deleted',
                kind: 'member',
                severity: 'warning',
                title: 'Member removed',
                message: `${name} was removed from the directory.`,
                dedupeKey: `member.deleted:${id}`,
                targetRoles: ['admin', 'minister'],
            });
        }
    }
}
