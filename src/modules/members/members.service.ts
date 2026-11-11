import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Member } from "./entities/member.entity";
import { CreateMemberDto } from "./dto/create-member.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";
import { PaginatedResult } from "../../common/interfaces/paginated-result.interface";
import { BulkCreateResult } from "../../common/interfaces/bulk-create-result.interface";
import { NOTIFICATION_EVENT } from "../notifications/notification-events";
import {
  normalizePersonName,
  normalizeTitleInitials,
} from "../../common/utils/name-normalizer";
import {
  type CalendarSystem,
  resolveFilterDateBound,
} from "../../common/utils/ethiopian-calendar";
import { resolveDateFieldForWrite } from "../../common/utils/calendar-dto.helper";

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    private readonly events: EventEmitter2,
  ) {}

  private async assertEmailAvailable(
    email: string | undefined | null,
    excludeId?: string,
  ): Promise<void> {
    const normalized = email?.trim().toLowerCase();
    if (!normalized) return;
    const qb = this.membersRepository
      .createQueryBuilder("member")
      .where("LOWER(member.email) = :email", { email: normalized });
    if (excludeId) {
      qb.andWhere("member.id != :excludeId", { excludeId });
    }
    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException("A member with this email already exists");
    }
  }

  async create(createMemberDto: CreateMemberDto): Promise<Member> {
    const {
      ministry_ids,
      date_of_birth,
      date_of_birth_calendar,
      date_of_birth_precision,
      joined_date,
      joined_date_calendar,
      joined_date_precision,
      salvation_date,
      salvation_date_calendar,
      salvation_date_precision,
      ...memberData
    } = createMemberDto;
    await this.assertEmailAvailable(memberData.email);

    const normalizedPayload: Partial<Member> = {
      ...memberData,
      ...(memberData.status !== undefined
        ? { status: memberData.status.trim().toLowerCase() }
        : {}),
      first_name: normalizePersonName(memberData.first_name),
      ...(memberData.middle_name !== undefined
        ? { middle_name: normalizePersonName(memberData.middle_name) }
        : {}),
      last_name: normalizePersonName(memberData.last_name),
      ...(memberData.profession !== undefined
        ? { profession: normalizeTitleInitials(memberData.profession) }
        : {}),
      ...(memberData.employer !== undefined
        ? { employer: normalizeTitleInitials(memberData.employer) }
        : {}),
      ...(memberData.education_field !== undefined
        ? { education_field: normalizeTitleInitials(memberData.education_field) }
        : {}),
    };

    const resolvedDob = resolveDateFieldForWrite(
      "date_of_birth",
      date_of_birth,
      {
        calendar: date_of_birth_calendar,
        precision: date_of_birth_precision,
        allowPartial: true,
      },
    );
    if (resolvedDob !== undefined) {
      normalizedPayload.date_of_birth = resolvedDob.value;
      normalizedPayload.date_of_birth_precision = resolvedDob.precision;
      normalizedPayload.date_of_birth_calendar = resolvedDob.calendar;
    }

    const resolvedJoined = resolveDateFieldForWrite(
      "joined_date",
      joined_date,
      {
        calendar: joined_date_calendar,
        precision: joined_date_precision,
        allowPartial: true,
      },
    );
    if (resolvedJoined !== undefined) {
      normalizedPayload.joined_date = resolvedJoined.value;
      normalizedPayload.joined_date_precision = resolvedJoined.precision;
      normalizedPayload.joined_date_calendar = resolvedJoined.calendar;
    }

    const resolvedSalvation = resolveDateFieldForWrite(
      "salvation_date",
      salvation_date,
      {
        calendar: salvation_date_calendar,
        precision: salvation_date_precision,
        allowPartial: true,
      },
    );
    if (resolvedSalvation !== undefined) {
      normalizedPayload.salvation_date = resolvedSalvation.value;
      normalizedPayload.salvation_date_precision = resolvedSalvation.precision;
      normalizedPayload.salvation_date_calendar = resolvedSalvation.calendar;
    }

    const member = this.membersRepository.create(normalizedPayload);
    const saved = await this.membersRepository.save(member);

    if (ministry_ids && ministry_ids.length > 0) {
      const ministryMembers = ministry_ids.map((ministry_id) => ({
        ministry_id,
        member_id: saved.id,
      }));
      await this.membersRepository.manager
        .getRepository("MinistryMember")
        .save(ministryMembers);
    }
    const name = `${saved.first_name} ${saved.last_name}`.trim();
    this.events.emit(NOTIFICATION_EVENT, {
      eventName: "member.created",
      kind: "member",
      severity: "success",
      title: "New member added",
      message: `${name} was added to the directory.`,
      href: `/members/details/${saved.id}`,
      dedupeKey: `member.created:${saved.id}`,
      targetRoles: ["admin", "minister"],
    });
    this.events.emit("dashboard.invalidate");
    return saved;
  }

  async createBulk(items: CreateMemberDto[]): Promise<BulkCreateResult> {
    const errors: BulkCreateResult["errors"] = [];
    let created = 0;

    for (let i = 0; i < items.length; i += 1) {
      try {
        await this.create(items[i]);
        created += 1;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create member";
        errors.push({ index: i, message });
      }
    }

    return { created, failed: errors.length, errors };
  }

  async findAllPaginated(
    page = 1,
    limit = 20,
    search?: string,
    filters?: {
      status?: string;
      marital_status?: string;
      joined_from?: string;
      joined_to?: string;
      joined_calendar?: CalendarSystem;
      sort_by?: "created_at" | "joined_date" | "visit_count";
      sort_order?: string;
    },
  ): Promise<PaginatedResult<Member>> {
    const qb = this.membersRepository.createQueryBuilder("member");

    if (search?.trim()) {
      const pattern = `%${search.trim().toLowerCase()}%`;
      qb.andWhere(
        "(LOWER(member.first_name) LIKE :pattern OR LOWER(member.last_name) LIKE :pattern OR LOWER(COALESCE(member.email, '')) LIKE :pattern OR COALESCE(member.phone, '') LIKE :pattern OR LOWER(COALESCE(member.address, '')) LIKE :pattern)",
        { pattern },
      );
    }

    if (filters?.status?.trim()) {
      qb.andWhere("LOWER(member.status) = :status", {
        status: filters.status.trim().toLowerCase(),
      });
    }

    if (filters?.marital_status?.trim()) {
      qb.andWhere("LOWER(member.marital_status) = :marital", {
        marital: filters.marital_status.trim().toLowerCase(),
      });
    }

    if (filters?.joined_from) {
      const boundFrom =
        resolveFilterDateBound(
          filters.joined_from,
          "start",
          filters.joined_calendar,
        ) ?? filters.joined_from;
      qb.andWhere(
        "COALESCE(member.joined_date, CAST(member.created_at AS date)) >= :joinedFrom",
        { joinedFrom: boundFrom },
      );
    }

    if (filters?.joined_to) {
      const boundTo =
        resolveFilterDateBound(
          filters.joined_to,
          "end",
          filters.joined_calendar,
        ) ?? filters.joined_to;
      qb.andWhere(
        "COALESCE(member.joined_date, CAST(member.created_at AS date)) <= :joinedTo",
        { joinedTo: boundTo },
      );
    }

    const sortBy = filters?.sort_by || "created_at";
    const sortOrder: "ASC" | "DESC" =
      (filters?.sort_order || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";

    if (sortBy === "visit_count") {
      qb.orderBy("member.visit_count", sortOrder)
        .addOrderBy("member.created_at", "DESC")
        .addOrderBy("member.id", "DESC");
    } else if (sortBy === "joined_date") {
      qb.orderBy(
        "COALESCE(member.joined_date, CAST(member.created_at AS date))",
        sortOrder,
      ).addOrderBy("member.id", sortOrder);
    } else {
      qb.orderBy("member.created_at", sortOrder).addOrderBy(
        "member.id",
        sortOrder,
      );
    }

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
      order: { created_at: "DESC" },
    });
  }

  async findOne(id: string): Promise<Member> {
    const member = await this.membersRepository.findOne({
      where: { id },
      relations: ["ministry_members", "ministry_members.ministry", "location"],
    });
    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }
    return member;
  }

  async update(
    id: string,
    updateMemberDto: UpdateMemberDto,
    actorUserId?: string,
  ): Promise<Member> {
    const {
      ministry_ids,
      date_of_birth,
      date_of_birth_calendar,
      date_of_birth_precision,
      joined_date,
      joined_date_calendar,
      joined_date_precision,
      salvation_date,
      salvation_date_calendar,
      salvation_date_precision,
      ...memberData
    } = updateMemberDto;
    if (memberData.email !== undefined) {
      await this.assertEmailAvailable(memberData.email, id);
    }

    const normalizedStatus =
      memberData.status !== undefined
        ? memberData.status.trim().toLowerCase()
        : undefined;

    const memberPatch: Partial<Member> = {
      ...memberData,
      ...(normalizedStatus !== undefined ? { status: normalizedStatus } : {}),
      ...(normalizedStatus === "active"
        ? {
            approved_at: new Date(),
            ...(actorUserId ? { approved_by_user_id: actorUserId } : {}),
          }
        : {}),
      ...(memberData.first_name !== undefined
        ? { first_name: normalizePersonName(memberData.first_name) }
        : {}),
      ...(memberData.middle_name !== undefined
        ? { middle_name: normalizePersonName(memberData.middle_name) }
        : {}),
      ...(memberData.last_name !== undefined
        ? { last_name: normalizePersonName(memberData.last_name) }
        : {}),
      ...(memberData.profession !== undefined
        ? { profession: normalizeTitleInitials(memberData.profession) }
        : {}),
      ...(memberData.employer !== undefined
        ? { employer: normalizeTitleInitials(memberData.employer) }
        : {}),
      ...(memberData.education_field !== undefined
        ? { education_field: normalizeTitleInitials(memberData.education_field) }
        : {}),
    };

    const resolvedDob = resolveDateFieldForWrite(
      "date_of_birth",
      date_of_birth,
      {
        calendar: date_of_birth_calendar,
        precision: date_of_birth_precision,
        allowPartial: true,
      },
    );
    if (resolvedDob !== undefined) {
      memberPatch.date_of_birth = resolvedDob.value;
      memberPatch.date_of_birth_precision = resolvedDob.precision;
      memberPatch.date_of_birth_calendar = resolvedDob.calendar;
    }

    const resolvedJoined = resolveDateFieldForWrite(
      "joined_date",
      joined_date,
      {
        calendar: joined_date_calendar,
        precision: joined_date_precision,
        allowPartial: true,
      },
    );
    if (resolvedJoined !== undefined) {
      memberPatch.joined_date = resolvedJoined.value;
      memberPatch.joined_date_precision = resolvedJoined.precision;
      memberPatch.joined_date_calendar = resolvedJoined.calendar;
    }

    const resolvedSalvation = resolveDateFieldForWrite(
      "salvation_date",
      salvation_date,
      {
        calendar: salvation_date_calendar,
        precision: salvation_date_precision,
        allowPartial: true,
      },
    );
    if (resolvedSalvation !== undefined) {
      memberPatch.salvation_date = resolvedSalvation.value;
      memberPatch.salvation_date_precision = resolvedSalvation.precision;
      memberPatch.salvation_date_calendar = resolvedSalvation.calendar;
    }

    if (Object.keys(memberPatch).length > 0) {
      await this.membersRepository.update(id, memberPatch);
    }

    if (ministry_ids !== undefined) {
      await this.membersRepository.manager
        .getRepository("MinistryMember")
        .delete({ member_id: id });

      if (ministry_ids.length > 0) {
        const ministryMembers = ministry_ids.map((ministry_id) => ({
          ministry_id,
          member_id: id,
        }));
        await this.membersRepository.manager
          .getRepository("MinistryMember")
          .save(ministryMembers);
      }
    }

    const member = await this.findOne(id);
    const name = `${member.first_name} ${member.last_name}`.trim();
    this.events.emit(NOTIFICATION_EVENT, {
      eventName: "member.updated",
      kind: "member",
      severity: "info",
      title: "Member updated",
      message: `${name}'s profile was updated.`,
      href: `/members/details/${id}`,
      dedupeKey: `member.updated:${id}:${Date.now()}`,
      targetRoles: ["admin", "minister"],
    });
    this.events.emit("dashboard.invalidate");
    return member;
  }

  async remove(id: string): Promise<void> {
    const member = await this.membersRepository.findOne({ where: { id } });
    const result = await this.membersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }
    this.events.emit("dashboard.invalidate");
    if (member) {
      const name = `${member.first_name} ${member.last_name}`.trim();
      this.events.emit(NOTIFICATION_EVENT, {
        eventName: "member.deleted",
        kind: "member",
        severity: "warning",
        title: "Member removed",
        message: `${name} was removed from the directory.`,
        dedupeKey: `member.deleted:${id}`,
        targetRoles: ["admin", "minister"],
      });
    }
  }
}
