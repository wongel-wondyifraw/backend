import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { PlanMinister } from './entities/plan-minister.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Minister } from '../ministers/entities/minister.entity';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly plansRepository: Repository<Plan>,
    @InjectRepository(PlanMinister)
    private readonly planMinistersRepository: Repository<PlanMinister>,
    @InjectRepository(Minister)
    private readonly ministersRepository: Repository<Minister>,
  ) {}

  private async assertMinistersExist(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const found = await this.ministersRepository.find({
      where: { id: In(ids) },
      select: ['id'],
    });
    if (found.length !== ids.length) {
      throw new BadRequestException('One or more ministers were not found');
    }
  }

  private async replaceMinisters(planId: string, ministerIds: string[]): Promise<void> {
    await this.planMinistersRepository.delete({ plan_id: planId });
    if (!ministerIds.length) return;
    const rows = ministerIds.map((minister_id) =>
      this.planMinistersRepository.create({ plan_id: planId, minister_id }),
    );
    await this.planMinistersRepository.save(rows);
  }

  private relations = {
    plan_ministers: { minister: true },
  } as const;

  async create(dto: CreatePlanDto): Promise<Plan> {
    const ministerIds = dto.minister_ids ?? [];
    await this.assertMinistersExist(ministerIds);

    if (dto.start_time && dto.end_time && dto.end_time < dto.start_time) {
      throw new BadRequestException('end_time must be after start_time');
    }

    const plan = this.plansRepository.create({
      title: dto.title.trim(),
      type: dto.type,
      plan_date: dto.plan_date,
      start_time: dto.start_time || null,
      end_time: dto.end_time || null,
      location: dto.location?.trim() || null,
      notes: dto.notes?.trim() || null,
      status: dto.status || 'planned',
    });
    const saved = await this.plansRepository.save(plan);
    await this.replaceMinisters(saved.id, ministerIds);
    return this.findOne(saved.id);
  }

  async findAllPaginated(
    page = 1,
    limit = 20,
    search?: string,
    filters?: { type?: string; from?: string; to?: string; status?: string },
  ): Promise<PaginatedResult<Plan>> {
    const qb = this.plansRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.plan_ministers', 'pm')
      .leftJoinAndSelect('pm.minister', 'minister');

    if (search?.trim()) {
      const pattern = `%${search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(plan.title) LIKE :pattern OR LOWER(COALESCE(plan.location, \'\')) LIKE :pattern OR LOWER(COALESCE(plan.notes, \'\')) LIKE :pattern)',
        { pattern },
      );
    }

    if (filters?.type) {
      qb.andWhere('plan.type = :type', { type: filters.type });
    }

    if (filters?.status) {
      qb.andWhere('plan.status = :status', { status: filters.status });
    }

    if (filters?.from) {
      qb.andWhere('plan.plan_date >= :from', { from: filters.from });
    }

    if (filters?.to) {
      qb.andWhere('plan.plan_date <= :to', { to: filters.to });
    }

    qb.orderBy('plan.plan_date', 'ASC')
      .addOrderBy('plan.start_time', 'ASC', 'NULLS LAST')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.plansRepository.findOne({
      where: { id },
      relations: this.relations,
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async update(id: string, dto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);

    if (dto.title !== undefined) plan.title = dto.title.trim();
    if (dto.type !== undefined) plan.type = dto.type;
    if (dto.plan_date !== undefined) plan.plan_date = dto.plan_date;
    if (dto.start_time !== undefined) plan.start_time = dto.start_time || null;
    if (dto.end_time !== undefined) plan.end_time = dto.end_time || null;
    if (dto.location !== undefined) plan.location = dto.location?.trim() || null;
    if (dto.notes !== undefined) plan.notes = dto.notes?.trim() || null;
    if (dto.status !== undefined) plan.status = dto.status;

    const start = dto.start_time !== undefined ? plan.start_time : plan.start_time;
    const end = dto.end_time !== undefined ? plan.end_time : plan.end_time;
    if (start && end && end < start) {
      throw new BadRequestException('end_time must be after start_time');
    }

    await this.plansRepository.save(plan);

    if (dto.minister_ids !== undefined) {
      await this.assertMinistersExist(dto.minister_ids);
      await this.replaceMinisters(id, dto.minister_ids);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.plansRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    await this.plansRepository.delete(id);
  }
}
