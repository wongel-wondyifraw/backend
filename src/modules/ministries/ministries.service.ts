import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Ministry } from "./entities/ministry.entity";
import { MinistryMember } from "./entities/ministry-member.entity";
import { CreateMinistryDto } from "./dto/create-ministry.dto";
import { UpdateMinistryDto } from "./dto/update-ministry.dto";
import { PaginatedResult } from "../../common/interfaces/paginated-result.interface";
import { NOTIFICATION_EVENT } from "../notifications/notification-events";
import { LeaderResolverService } from "../../common/leadership/leader-resolver.service";
import type { LeaderType } from "../../common/leadership/leader.types";

@Injectable()
export class MinistriesService {
  constructor(
    @InjectRepository(Ministry)
    private readonly ministriesRepository: Repository<Ministry>,
    @InjectRepository(MinistryMember)
    private readonly ministryMembersRepository: Repository<MinistryMember>,
    private readonly events: EventEmitter2,
    private readonly leaders: LeaderResolverService,
  ) {}

  private normalizeLeader(dto: {
    leader_id?: string | null;
    leader_type?: string | null;
  }) {
    if (!dto.leader_id) {
      return { leader_id: null, leader_type: null as LeaderType | null };
    }
    return {
      leader_id: dto.leader_id,
      leader_type: (dto.leader_type as LeaderType) || "member",
    };
  }

  async create(createMinistryDto: CreateMinistryDto): Promise<Ministry> {
    const leader = this.normalizeLeader(createMinistryDto);
    await this.leaders.assertExists(leader.leader_id, leader.leader_type);
    const ministry = this.ministriesRepository.create({
      name: createMinistryDto.name,
      about: createMinistryDto.about ?? null,
      schedule: createMinistryDto.schedule ?? null,
      ...leader,
    });
    const saved = await this.ministriesRepository.save(ministry);
    this.events.emit(NOTIFICATION_EVENT, {
      eventName: "ministry.created",
      kind: "ministry",
      severity: "success",
      title: "New ministry created",
      message: `${saved.name} was added.`,
      href: `/ministries/details/${saved.id}`,
      dedupeKey: `ministry.created:${saved.id}`,
      targetRoles: ["admin", "minister"],
    });
    return this.findOne(saved.id);
  }

  async findAllPaginated(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<PaginatedResult<Ministry>> {
    const qb = this.ministriesRepository.createQueryBuilder("ministry");

    if (search?.trim()) {
      const pattern = `%${search.trim().toLowerCase()}%`;
      qb.where("LOWER(ministry.name) LIKE :pattern", { pattern });
    }

    qb.orderBy("ministry.created_at", "DESC");
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

  async findAll(): Promise<Ministry[]> {
    const rows = await this.ministriesRepository.find({
      order: { created_at: "DESC" },
    });
    return this.leaders.attachLeaders(rows);
  }

  async findOne(id: string): Promise<Ministry> {
    const ministry = await this.ministriesRepository.findOne({ where: { id } });
    if (!ministry) {
      throw new NotFoundException(`Ministry with ID ${id} not found`);
    }
    const [withLeader] = await this.leaders.attachLeaders([ministry]);
    return withLeader;
  }

  async update(
    id: string,
    updateMinistryDto: UpdateMinistryDto,
  ): Promise<Ministry> {
    const patch: Partial<Ministry> = { ...updateMinistryDto };
    if (
      "leader_id" in updateMinistryDto ||
      "leader_type" in updateMinistryDto
    ) {
      const leader = this.normalizeLeader(updateMinistryDto);
      await this.leaders.assertExists(leader.leader_id, leader.leader_type);
      Object.assign(patch, leader);
    }
    await this.ministriesRepository.update(id, patch);
    const ministry = await this.findOne(id);
    this.events.emit(NOTIFICATION_EVENT, {
      eventName: "ministry.updated",
      kind: "ministry",
      severity: "info",
      title: "Ministry updated",
      message: `${ministry.name} was updated.`,
      href: `/ministries/details/${id}`,
      dedupeKey: `ministry.updated:${id}:${Date.now()}`,
      targetRoles: ["admin", "minister"],
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
        eventName: "ministry.deleted",
        kind: "ministry",
        severity: "warning",
        title: "Ministry removed",
        message: `${ministry.name} was removed.`,
        dedupeKey: `ministry.deleted:${id}`,
        targetRoles: ["admin", "minister"],
      });
    }
  }

  async addMember(
    ministryId: string,
    memberId: string,
  ): Promise<MinistryMember> {
    const existing = await this.ministryMembersRepository.findOne({
      where: { ministry_id: ministryId, member_id: memberId },
    });
    if (existing) {
      throw new ConflictException("Member is already in this ministry");
    }

    const record = this.ministryMembersRepository.create({
      ministry_id: ministryId,
      member_id: memberId,
    });
    const saved = await this.ministryMembersRepository.save(record);
    const ministry = await this.findOne(ministryId);
    this.events.emit(NOTIFICATION_EVENT, {
      eventName: "ministry.member.added",
      kind: "ministry",
      severity: "info",
      title: "Ministry membership updated",
      message: `A member was added to ${ministry.name}.`,
      href: `/ministries/details/${ministryId}`,
      dedupeKey: `ministry.member.added:${ministryId}:${memberId}`,
      targetRoles: ["admin", "minister"],
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
      throw new NotFoundException("Member not found in this ministry");
    }
    this.events.emit(NOTIFICATION_EVENT, {
      eventName: "ministry.member.removed",
      kind: "ministry",
      severity: "info",
      title: "Ministry membership updated",
      message: `A member was removed from ${ministry.name}.`,
      href: `/ministries/details/${ministryId}`,
      dedupeKey: `ministry.member.removed:${ministryId}:${memberId}`,
      targetRoles: ["admin", "minister"],
    });
  }

  async getMinistryMembers(ministryId: string): Promise<MinistryMember[]> {
    return this.ministryMembersRepository.find({
      where: { ministry_id: ministryId },
      relations: ["member"],
      order: { joined_at: "DESC" },
    });
  }

  async getMemberMinistries(memberId: string): Promise<MinistryMember[]> {
    return this.ministryMembersRepository.find({
      where: { member_id: memberId },
      order: { joined_at: "DESC" },
    });
  }
}
