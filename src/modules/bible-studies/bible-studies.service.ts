import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BibleStudy } from './entities/bible-study.entity';
import { BibleStudyMember } from './entities/bible-study-member.entity';
import { CreateBibleStudyDto } from './dto/create-bible-study.dto';
import { UpdateBibleStudyDto } from './dto/update-bible-study.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { NOTIFICATION_EVENT } from '../notifications/notification-events';
import { BIBLE_BOOK_SET } from '../../common/constants/bible-books';
import { LeaderResolverService } from '../../common/leadership/leader-resolver.service';
import type { LeaderType } from '../../common/leadership/leader.types';

@Injectable()
export class BibleStudiesService {
  constructor(
    @InjectRepository(BibleStudy)
    private readonly bibleStudiesRepository: Repository<BibleStudy>,
    @InjectRepository(BibleStudyMember)
    private readonly bibleStudyMembersRepository: Repository<BibleStudyMember>,
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

  async create(dto: CreateBibleStudyDto): Promise<BibleStudy> {
    if (dto.content_type === 'book') {
      if (!dto.bible_book || !BIBLE_BOOK_SET.has(dto.bible_book)) {
        throw new BadRequestException('A valid Bible book is required when content type is Book');
      }
    }

    const leader = this.normalizeLeader(dto);
    const study = this.bibleStudiesRepository.create({
      name: dto.name,
      about: dto.about ?? null,
      schedule: dto.schedule ?? null,
      location: dto.location,
      content_type: dto.content_type,
      ...leader,
      bible_book: dto.content_type === 'book' ? (dto.bible_book ?? null) : null,
      material_url: dto.content_type === 'study_material' ? (dto.material_url ?? null) : null,
    });
    const saved = await this.bibleStudiesRepository.save(study);
    this.events.emit(NOTIFICATION_EVENT, {
      eventName: 'bible_study.created',
      kind: 'system',
      severity: 'success',
      title: 'New Bible study created',
      message: `${saved.name} was added.`,
      href: `/bible-study/details/${saved.id}`,
      dedupeKey: `bible_study.created:${saved.id}`,
      targetRoles: ['admin', 'minister'],
    });
    return this.findOne(saved.id);
  }

  async findAllPaginated(page = 1, limit = 20, search?: string): Promise<PaginatedResult<BibleStudy>> {
    const qb = this.bibleStudiesRepository.createQueryBuilder('bible_study');

    if (search?.trim()) {
      const pattern = `%${search.trim().toLowerCase()}%`;
      qb.where(
        'LOWER(bible_study.name) LIKE :pattern OR LOWER(bible_study.location) LIKE :pattern OR LOWER(bible_study.bible_book) LIKE :pattern',
        { pattern },
      );
    }

    qb.orderBy('bible_study.created_at', 'DESC');
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

  async findOne(id: string): Promise<BibleStudy> {
    const study = await this.bibleStudiesRepository.findOne({ where: { id } });
    if (!study) {
      throw new NotFoundException(`Bible study with ID ${id} not found`);
    }
    const [withLeader] = await this.leaders.attachLeaders([study]);
    return withLeader;
  }

  async update(id: string, dto: UpdateBibleStudyDto): Promise<BibleStudy> {
    const existing = await this.findOne(id);
    const contentType = dto.content_type ?? existing.content_type;

    if (contentType === 'book') {
      const book = dto.bible_book ?? existing.bible_book;
      if (!book || !BIBLE_BOOK_SET.has(book)) {
        throw new BadRequestException('A valid Bible book is required when content type is Book');
      }
    }

    const patch: Partial<BibleStudy> = {
      content_type: contentType,
    };

    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.about !== undefined) patch.about = dto.about ?? null;
    if (dto.schedule !== undefined) patch.schedule = dto.schedule ?? null;
    if (dto.location !== undefined) patch.location = dto.location;
    if ('leader_id' in dto || 'leader_type' in dto) {
      Object.assign(patch, this.normalizeLeader(dto));
    }

    if (contentType === 'book') {
      patch.bible_book = dto.bible_book ?? existing.bible_book;
      patch.material_url = null;
    } else {
      patch.bible_book = null;
      if (dto.material_url !== undefined) {
        patch.material_url = dto.material_url ?? null;
      }
    }

    await this.bibleStudiesRepository.update(id, patch);
    const study = await this.findOne(id);
    this.events.emit(NOTIFICATION_EVENT, {
      eventName: 'bible_study.updated',
      kind: 'system',
      severity: 'info',
      title: 'Bible study updated',
      message: `${study.name} was updated.`,
      href: `/bible-study/details/${id}`,
      dedupeKey: `bible_study.updated:${id}:${Date.now()}`,
      targetRoles: ['admin', 'minister'],
    });
    return study;
  }

  async remove(id: string): Promise<void> {
    const study = await this.bibleStudiesRepository.findOne({ where: { id } });
    const result = await this.bibleStudiesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Bible study with ID ${id} not found`);
    }
    if (study) {
      this.events.emit(NOTIFICATION_EVENT, {
        eventName: 'bible_study.deleted',
        kind: 'system',
        severity: 'warning',
        title: 'Bible study removed',
        message: `${study.name} was removed.`,
        dedupeKey: `bible_study.deleted:${id}`,
        targetRoles: ['admin', 'minister'],
      });
    }
  }

  async addMember(bibleStudyId: string, memberId: string): Promise<BibleStudyMember> {
    const existing = await this.bibleStudyMembersRepository.findOne({
      where: { bible_study_id: bibleStudyId, member_id: memberId },
    });
    if (existing) {
      throw new ConflictException('Member is already in this Bible study');
    }

    const record = this.bibleStudyMembersRepository.create({
      bible_study_id: bibleStudyId,
      member_id: memberId,
    });
    const saved = await this.bibleStudyMembersRepository.save(record);
    const study = await this.findOne(bibleStudyId);
    this.events.emit(NOTIFICATION_EVENT, {
      eventName: 'bible_study.member.added',
      kind: 'system',
      severity: 'info',
      title: 'Bible study membership updated',
      message: `A member was added to ${study.name}.`,
      href: `/bible-study/details/${bibleStudyId}`,
      dedupeKey: `bible_study.member.added:${bibleStudyId}:${memberId}`,
      targetRoles: ['admin', 'minister'],
    });
    return saved;
  }

  async removeMember(bibleStudyId: string, memberId: string): Promise<void> {
    const study = await this.findOne(bibleStudyId);
    const result = await this.bibleStudyMembersRepository.delete({
      bible_study_id: bibleStudyId,
      member_id: memberId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('Member not found in this Bible study');
    }
    this.events.emit(NOTIFICATION_EVENT, {
      eventName: 'bible_study.member.removed',
      kind: 'system',
      severity: 'info',
      title: 'Bible study membership updated',
      message: `A member was removed from ${study.name}.`,
      href: `/bible-study/details/${bibleStudyId}`,
      dedupeKey: `bible_study.member.removed:${bibleStudyId}:${memberId}`,
      targetRoles: ['admin', 'minister'],
    });
  }

  async getMembers(bibleStudyId: string): Promise<BibleStudyMember[]> {
    return this.bibleStudyMembersRepository.find({
      where: { bible_study_id: bibleStudyId },
      relations: ['member'],
      order: { joined_at: 'DESC' },
    });
  }
}
