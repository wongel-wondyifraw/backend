import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ministry } from './entities/ministry.entity';
import { CreateMinistryDto } from './dto/create-ministry.dto';
import { UpdateMinistryDto } from './dto/update-ministry.dto';

@Injectable()
export class MinistriesService {
    constructor(
        @InjectRepository(Ministry)
        private readonly ministriesRepository: Repository<Ministry>,
    ) { }

    async create(createMinistryDto: CreateMinistryDto): Promise<Ministry> {
        const ministry = this.ministriesRepository.create(createMinistryDto);
        return this.ministriesRepository.save(ministry);
    }

    async findAll(): Promise<Ministry[]> {
        return this.ministriesRepository.find({
            order: { created_at: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Ministry> {
        const ministry = await this.ministriesRepository.findOne({ where: { id } });
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
}
