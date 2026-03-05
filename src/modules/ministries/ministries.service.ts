import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ministry } from './entities/ministry.entity';
import { MinistryMember } from './entities/ministry-member.entity';
import { CreateMinistryDto } from './dto/create-ministry.dto';
import { UpdateMinistryDto } from './dto/update-ministry.dto';

@Injectable()
export class MinistriesService {
    constructor(
        @InjectRepository(Ministry)
        private readonly ministriesRepository: Repository<Ministry>,
        @InjectRepository(MinistryMember)
        private readonly ministryMembersRepository: Repository<MinistryMember>,
    ) { }

    // ==================== Ministry CRUD ====================

    async create(createMinistryDto: CreateMinistryDto): Promise<Ministry> {
        const ministry = this.ministriesRepository.create(createMinistryDto);
        return this.ministriesRepository.save(ministry);
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
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const result = await this.ministriesRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Ministry with ID ${id} not found`);
        }
    }

    // ==================== Ministry Members ====================

    async addMember(ministryId: string, memberId: string): Promise<MinistryMember> {
        // Check if already exists
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
        return this.ministryMembersRepository.save(record);
    }

    async removeMember(ministryId: string, memberId: string): Promise<void> {
        const result = await this.ministryMembersRepository.delete({
            ministry_id: ministryId,
            member_id: memberId,
        });
        if (result.affected === 0) {
            throw new NotFoundException('Member not found in this ministry');
        }
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
            relations: ['ministry'],
            order: { joined_at: 'DESC' },
        });
    }
}
