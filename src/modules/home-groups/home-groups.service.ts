import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HomeGroup } from './entities/home-group.entity';
import { HomeGroupMember } from './entities/home-group-member.entity';
import { CreateHomeGroupDto } from './dto/create-home-group.dto';
import { UpdateHomeGroupDto } from './dto/update-home-group.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { NOTIFICATION_EVENT } from '../notifications/notification-events';
import { LeaderResolverService } from '../../common/leadership/leader-resolver.service';
import type { LeaderType } from '../../common/leadership/leader.types';

@Injectable()
export class HomeGroupsService {
  constructor(
    @InjectRepository(HomeGroup)
    private readonly homeGroupsRepository: Repository<HomeGroup>,
    @InjectRepository(HomeGroupMember)
    private readonly homeGroupMembersRepository: Repository<HomeGroupMember>,
    private readonly events: EventEmitter2,
    private readonly leaders: LeaderResolverService,
  ) {}

  private normalizeLeader(dto: { leader_id?: string | null; leader_type?: string | null }) {
    if (!dto.leader_id) {
      return { leader_id: null, leader_type: null as LeaderType | null };
    }
    return {
      leader_id: dto.leader_id,
      leader_type: (dto.leader_type as LeaderType) || 'member',
    };
  }

  async create(dto: CreateHomeGroupDto): Promise<HomeGroup> {
    const leader = this.normalizeLeader(dto);
    const homeGroup = this.homeGroupsRepository.create({
      name: dto.name,
      about: dto.about ?? null,
      schedule: dto.schedule ?? null,
      location: dto.location,
      ...leader,
    });
    const saved = await this.homeGroupsRepository.save(homeGroup);
    this.events.emit(NOTIFICATION_EVENT, {
      eventName: 'home_group.created',
      kind: 'home_group',
      severity: 'success',
      title: 'New home group created',
      message: `${saved.name} was added.`,
      href: `/members/home-groups/details/${saved.id}`,
      dedupeKey: `home_group.created:${saved.id}`,
      targetRoles: ['admin', 'minister'],
    });
    return this.findOne(saved.id);
  }

  async findAllPaginated(page = 1, limit = 20, search?: string): Promise<PaginatedResult<HomeGroup>> {
    const qb = this.homeGroupsRepository.createQueryBuilder('home_group');

    if (search?.trim()) {
      const pattern = `%${search.trim().toLowerCase()}%`;
      qb.where(
        'LOWER(home_group.name) LIKE :pattern OR LOWER(home_group.location) LIKE :pattern',
        { pattern },
      );
    }

    qb.orderBy('home_group.created_at', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [rows, total] = await qb.getManyAndCount();
    const data = await this.leaders.attachLeaders(rows);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string): Promise<HomeGroup> {
    const homeGroup = await this.homeGroupsRepository.findOne({ where: { id } });
    if (!homeGroup) {
      throw new NotFoundException(`Home group with ID ${id} not found`);
    }
    const [withLeader] = await this.leaders.attachLeaders([homeGroup]);
    return withLeader;
  }

  async update(id: string, dto: UpdateHomeGroupDto): Promise<HomeGroup> {
    const patch: Partial<HomeGroup> = { ...dto };
    if ('leader_id' in dto || 'leader_type' in dto) {
      Object.assign(patch, this.normalizeLeader(dto));
    }
    await this.homeGroupsRepository.update(id, patch);
    const homeGroup = await this.findOne(id);
    this.events.emit(NOTIFICATION_EVENT, {
      eventName: 'home_group.updated',
      kind: 'home_group',
      severity: 'info',
      title: 'Home group updated',
      message: `${homeGroup.name} was updated.`,
      href: `/members/home-groups/details/${id}`,
      dedupeKey: `home_group.updated:${id}:${Date.now()}`,
      targetRoles: ['admin', 'minister'],
    });
    return homeGroup;
  }

  async remove(id: string): Promise<void> {
    const homeGroup = await this.homeGroupsRepository.findOne({ where: { id } });
    const result = await this.homeGroupsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Home group with ID ${id} not found`);
    }
    if (homeGroup) {
      this.events.emit(NOTIFICATION_EVENT, {
        eventName: 'home_group.deleted',
        kind: 'home_group',
        severity: 'warning',
        title: 'Home group removed',
        message: `${homeGroup.name} was removed.`,
        dedupeKey: `home_group.deleted:${id}`,
        targetRoles: ['admin', 'minister'],
      });
    }
  }

  async addMember(homeGroupId: string, memberId: string): Promise<HomeGroupMember> {
    const existing = await this.homeGroupMembersRepository.findOne({
      where: { home_group_id: homeGroupId, member_id: memberId },
    });
    if (existing) {
      throw new ConflictException('Member is already in this home group');
    }

    const record = this.homeGroupMembersRepository.create({
      home_group_id: homeGroupId,
      member_id: memberId,
    });
    const saved = await this.homeGroupMembersRepository.save(record);
    const homeGroup = await this.findOne(homeGroupId);
    this.events.emit(NOTIFICATION_EVENT, {
      eventName: 'home_group.member.added',
      kind: 'home_group',
      severity: 'info',
      title: 'Home group membership updated',
      message: `A member was added to ${homeGroup.name}.`,
      href: `/members/home-groups/details/${homeGroupId}`,
      dedupeKey: `home_group.member.added:${homeGroupId}:${memberId}`,
      targetRoles: ['admin', 'minister'],
    });
    return saved;
  }

  async removeMember(homeGroupId: string, memberId: string): Promise<void> {
    const homeGroup = await this.findOne(homeGroupId);
    const result = await this.homeGroupMembersRepository.delete({
      home_group_id: homeGroupId,
      member_id: memberId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('Member not found in this home group');
    }
    this.events.emit(NOTIFICATION_EVENT, {
      eventName: 'home_group.member.removed',
      kind: 'home_group',
      severity: 'info',
      title: 'Home group membership updated',
      message: `A member was removed from ${homeGroup.name}.`,
      href: `/members/home-groups/details/${homeGroupId}`,
      dedupeKey: `home_group.member.removed:${homeGroupId}:${memberId}`,
      targetRoles: ['admin', 'minister'],
    });
  }

  async getHomeGroupMembers(homeGroupId: string): Promise<HomeGroupMember[]> {
    return this.homeGroupMembersRepository.find({
      where: { home_group_id: homeGroupId },
      relations: ['member'],
      order: { joined_at: 'DESC' },
    });
  }
}
