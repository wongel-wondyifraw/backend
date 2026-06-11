import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Ministry } from './entities/ministry.entity';
import { MinistryMember } from './entities/ministry-member.entity';
import { CreateMinistryDto } from './dto/create-ministry.dto';
import { UpdateMinistryDto } from './dto/update-ministry.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { NOTIFICATION_EVENT } from '../notifications/notification-events';

@Injectable()
export class MinistriesService {
    constructor(
        @InjectRepository(Ministry)
        private readonly ministriesRepository: Repository<Ministry>,
        @InjectRepository(MinistryMember)
        private readonly ministryMembersRepository: Repository<MinistryMember>,
        private readonly events: EventEmitter2,
    ) { }

    async create(createMinistryDto: CreateMinistryDto): Promise<Ministry> {
        const ministry = this.ministriesRepository.create(createMinistryDto);
        const saved = await this.ministriesRepository.save(ministry);
        this.events.emit(NOTIFICATION_EVENT, {
            eventName: 'ministry.created',
            kind: 'ministry',
            severity: 'success',
            title: 'New ministry created',
            message: `${saved.name} was added.`,
            href: `/ministries/${saved.id}`,
            dedupeKey: `ministry.created:${saved.id}`,
            targetRoles: ['admin', 'minister'],
        });
        return saved;
    }

    async findAllPaginated(page = 1, limit = 20, search?: string): Promise<PaginatedResult<Ministry>> {
        const qb = this.ministriesRepository.createQueryBuilder('ministry')
            .leftJoinAndSelect('ministry.leader', 'leader');

        if (search?.trim()) {
            const pattern = `%${search.trim().toLowerCase()}%`;
            qb.where('LOWER(ministry.name) LIKE :pattern', { pattern });
        }

        qb.orderBy('ministry.created_at', 'DESC');
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

    async findAll(): Promise<Ministry[]> {
        return this.ministriesRepository.find({
            relations: ['leader'],
            order: { created_at: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Ministry> {
        const ministry = await this.ministriesRepository.findOne({
            where: { id },
            relations: ['leader'],
        });
        if (!ministry) {
            throw new NotFoundException(`Ministry with ID ${id} not found`);
        }
        return ministry;
    }

    async update(id: string, updateMinistryDto: UpdateMinistryDto): Promise<Ministry> {
        await this.ministriesRepository.update(id, updateMinistryDto);
        const ministry = await this.findOne(id);
        this.events.emit(NOTIFICATION_EVENT, {
            eventName: 'ministry.updated',
            kind: 'ministry',
            severity: 'info',
            title: 'Ministry updated',
            message: `${ministry.name} was updated.`,
            href: `/ministries/${id}`,
            dedupeKey: `ministry.updated:${id}:${Date.now()}`,
            targetRoles: ['admin', 'minister'],
        });
        return ministry;
    }

    async remove(id: string): Promise<void> {
        const ministry = await this.ministriesRepository.findOne({ where: { id } });
        const result = await this.ministriesRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Ministry with ID ${id} not found`);
        }
        if (ministry) {
            this.events.emit(NOTIFICATION_EVENT, {
                eventName: 'ministry.deleted',
                kind: 'ministry',
                severity: 'warning',
                title: 'Ministry removed',
                message: `${ministry.name} was removed.`,
                dedupeKey: `ministry.deleted:${id}`,
                targetRoles: ['admin', 'minister'],
            });
        }
    }

    async addMember(ministryId: string, memberId: string): Promise<MinistryMember> {
        const existing = await this.ministryMembersRepository.findOne({
            where: { ministry_id: ministryId, member_id: memberId },
        });
        if (existing) {
            throw new ConflictException('Member is already in this ministry');
        }

        const record = this.ministryMembersRepository.create({
            ministry_id: ministryId,
            member_id: memberId,
        });
        const saved = await this.ministryMembersRepository.save(record);
        const ministry = await this.findOne(ministryId);
        this.events.emit(NOTIFICATION_EVENT, {
            eventName: 'ministry.member.added',
            kind: 'ministry',
            severity: 'info',
            title: 'Ministry membership updated',
            message: `A member was added to ${ministry.name}.`,
            href: `/ministries/${ministryId}`,
            dedupeKey: `ministry.member.added:${ministryId}:${memberId}`,
            targetRoles: ['admin', 'minister'],
        });
        return saved;
    }

    async removeMember(ministryId: string, memberId: string): Promise<void> {
        const ministry = await this.findOne(ministryId);
        const result = await this.ministryMembersRepository.delete({
            ministry_id: ministryId,
            member_id: memberId,
        });
        if (result.affected === 0) {
            throw new NotFoundException('Member not found in this ministry');
        }
        this.events.emit(NOTIFICATION_EVENT, {
            eventName: 'ministry.member.removed',
            kind: 'ministry',
            severity: 'info',
            title: 'Ministry membership updated',
            message: `A member was removed from ${ministry.name}.`,
            href: `/ministries/${ministryId}`,
            dedupeKey: `ministry.member.removed:${ministryId}:${memberId}`,
            targetRoles: ['admin', 'minister'],
        });
    }

    async getMinistryMembers(ministryId: string): Promise<MinistryMember[]> {
        return this.ministryMembersRepository.find({
            where: { ministry_id: ministryId },
            relations: ['member'],
            order: { joined_at: 'DESC' },
        });
    }

    async getMemberMinistries(memberId: string): Promise<MinistryMember[]> {
        return this.ministryMembersRepository.find({
            where: { member_id: memberId },
            order: { joined_at: 'DESC' },
        });
    }
}
