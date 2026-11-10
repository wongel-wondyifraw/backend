import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { randomBytes } from "crypto";
import { Minister } from "./entities/minister.entity";
import { CreateMinisterDto } from "./dto/create-minister.dto";
import { UpdateMinisterDto } from "./dto/update-minister.dto";
import { UsersService } from "../users/users.service";
import { User } from "../users/entities/user.entity";
import { PaginatedResult } from "../../common/interfaces/paginated-result.interface";
import { NOTIFICATION_EVENT } from "../notifications/notification-events";
import {
  normalizePersonName,
  normalizeTitleInitials,
} from "../../common/utils/name-normalizer";
import { resolveDateFieldForWrite } from "../../common/utils/calendar-dto.helper";

export type MinisterCreateResult = Minister & { temporary_password: string };

@Injectable()
export class MinistersService {
  constructor(
    @InjectRepository(Minister)
    private readonly ministersRepository: Repository<Minister>,
    private readonly usersService: UsersService,
    private readonly events: EventEmitter2,
  ) {}

  private generatePassword(length = 12): string {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    const bytes = randomBytes(length);
    return Array.from(bytes, (b) => chars[b % chars.length]).join("");
  }

  async create(
    dto: CreateMinisterDto,
    actingUser?: Partial<User>,
  ): Promise<MinisterCreateResult> {
    const email = dto.email.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException(
        "Email is required to create a minister login",
      );
    }

    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException("A user with this email already exists");
    }

    const existingMinister = await this.ministersRepository.findOne({
      where: { email },
    });
    if (existingMinister) {
      throw new ConflictException("A minister with this email already exists");
    }

    const temporaryPassword = this.generatePassword();
    const isActive = (dto.status ?? "active").toLowerCase() !== "inactive";
    const firstName = normalizePersonName(dto.first_name);
    const middleName =
      dto.middle_name !== undefined ? normalizePersonName(dto.middle_name) : "";
    const lastName = normalizePersonName(dto.last_name);
    const normalizedTitle =
      dto.title !== undefined ? normalizeTitleInitials(dto.title) : undefined;

    const {
      date_of_birth,
      date_of_birth_calendar,
      date_of_birth_precision,
      joined_date,
      joined_date_calendar,
      joined_date_precision,
      ...ministerRest
    } = dto;

    const resolvedDob = resolveDateFieldForWrite(
      "date_of_birth",
      date_of_birth,
      {
        calendar: date_of_birth_calendar,
        precision: date_of_birth_precision,
        allowPartial: true,
      },
    );
    const resolvedJoined = resolveDateFieldForWrite(
      "joined_date",
      joined_date,
      {
        calendar: joined_date_calendar,
        precision: joined_date_precision,
        allowPartial: true,
      },
    );

    const user = await this.usersService.create(
      {
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        email,
        password: temporaryPassword,
        role: "minister",
        title: normalizedTitle ?? undefined,
        avatar_url: dto.image_url ?? undefined,
        is_active: isActive,
        created_via: "minister_module",
      },
      actingUser,
    );

    const minister = this.ministersRepository.create({
      ...ministerRest,
      first_name: firstName,
      ...(dto.middle_name !== undefined ? { middle_name: middleName } : {}),
      last_name: lastName,
      ...(normalizedTitle !== undefined ? { title: normalizedTitle } : {}),
      ...(resolvedDob !== undefined
        ? {
            date_of_birth: resolvedDob.value,
            date_of_birth_precision: resolvedDob.precision,
            date_of_birth_calendar: resolvedDob.calendar,
          }
        : {}),
      ...(resolvedJoined !== undefined
        ? {
            joined_date: resolvedJoined.value,
            joined_date_precision: resolvedJoined.precision,
            joined_date_calendar: resolvedJoined.calendar,
          }
        : {}),
      email,
      user_id: user.id,
      status: dto.status ?? "active",
    });
    const saved = await this.ministersRepository.save(minister);

    const name = `${saved.first_name} ${saved.last_name}`.trim();
    this.events.emit(NOTIFICATION_EVENT, {
      eventName: "minister.created",
      kind: "user",
      severity: "success",
      title: "New minister registered",
      message: `${name} was registered with a login account.`,
      href: `/ministers/details/${saved.id}`,
      dedupeKey: `minister.created:${saved.id}`,
      targetRoles: ["admin"],
    });

    return Object.assign(saved, { temporary_password: temporaryPassword });
  }

  async findAllPaginated(
    page = 1,
    limit = 20,
    search?: string,
    status?: string,
  ): Promise<PaginatedResult<Minister>> {
    const qb = this.ministersRepository.createQueryBuilder("minister");

    if (search?.trim()) {
      const pattern = `%${search.trim().toLowerCase()}%`;
      qb.where(
        "LOWER(minister.first_name) LIKE :pattern OR LOWER(minister.last_name) LIKE :pattern OR LOWER(minister.email) LIKE :pattern OR minister.phone LIKE :pattern OR LOWER(minister.title) LIKE :pattern",
        { pattern },
      );
    }

    if (status?.trim()) {
      qb.andWhere("LOWER(minister.status) = :status", {
        status: status.trim().toLowerCase(),
      });
    }

    qb.orderBy("minister.created_at", "DESC");
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

  async findOne(id: string): Promise<Minister> {
    const minister = await this.ministersRepository.findOne({
      where: { id },
      relations: { user: { roleEntity: true } },
    });
    if (!minister) {
      throw new NotFoundException(`Minister with ID ${id} not found`);
    }
    if (minister.user) {
      const roleKey =
        minister.user.roleEntity?.key ?? minister.user.role ?? "minister";
      // Expose a stable role string for the client without nested roleEntity noise
      minister.user.role = roleKey;
    }
    return minister;
  }

  async update(
    id: string,
    dto: UpdateMinisterDto,
    actingUser?: Partial<User>,
  ): Promise<Minister> {
    const minister = await this.findOne(id);
    const {
      date_of_birth,
      date_of_birth_calendar,
      date_of_birth_precision,
      joined_date,
      joined_date_calendar,
      joined_date_precision,
      ...ministerRest
    } = dto;

    const ministerPatch: Partial<Minister> = {
      ...ministerRest,
      ...(ministerRest.first_name !== undefined
        ? { first_name: normalizePersonName(ministerRest.first_name) }
        : {}),
      ...(ministerRest.middle_name !== undefined
        ? { middle_name: normalizePersonName(ministerRest.middle_name) }
        : {}),
      ...(ministerRest.last_name !== undefined
        ? { last_name: normalizePersonName(ministerRest.last_name) }
        : {}),
      ...(ministerRest.title !== undefined
        ? { title: normalizeTitleInitials(ministerRest.title) }
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
      ministerPatch.date_of_birth = resolvedDob.value;
      ministerPatch.date_of_birth_precision = resolvedDob.precision;
      ministerPatch.date_of_birth_calendar = resolvedDob.calendar;
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
      ministerPatch.joined_date = resolvedJoined.value;
      ministerPatch.joined_date_precision = resolvedJoined.precision;
      ministerPatch.joined_date_calendar = resolvedJoined.calendar;
    }

    if (Object.keys(ministerPatch).length > 0) {
      await this.ministersRepository.update(id, ministerPatch);
    }

    const userPatch: Record<string, unknown> = {};
    if (ministerPatch.first_name !== undefined)
      userPatch.first_name = ministerPatch.first_name;
    if (ministerPatch.middle_name !== undefined)
      userPatch.middle_name = ministerPatch.middle_name;
    if (ministerPatch.last_name !== undefined)
      userPatch.last_name = ministerPatch.last_name;
    if (ministerPatch.title !== undefined) userPatch.title = ministerPatch.title;
    if (dto.image_url !== undefined) userPatch.avatar_url = dto.image_url;
    if (dto.status !== undefined) {
      userPatch.is_active = dto.status.toLowerCase() !== "inactive";
    }

    if (Object.keys(userPatch).length > 0) {
      await this.usersService.update(minister.user_id, userPatch, actingUser);
    }

    const updated = await this.findOne(id);
    const name = `${updated.first_name} ${updated.last_name}`.trim();
    this.events.emit(NOTIFICATION_EVENT, {
      eventName: "minister.updated",
      kind: "user",
      severity: "info",
      title: "Minister updated",
      message: `${name}'s profile was updated.`,
      href: `/ministers/details/${id}`,
      dedupeKey: `minister.updated:${id}:${Date.now()}`,
      targetRoles: ["admin"],
    });
    return updated;
  }

  async resetPassword(id: string): Promise<{ temporary_password: string }> {
    const minister = await this.findOne(id);
    const temporaryPassword = this.generatePassword();
    await this.usersService.setPasswordFromPlain(
      minister.user_id,
      temporaryPassword,
    );

    const name = `${minister.first_name} ${minister.last_name}`.trim();
    this.events.emit(NOTIFICATION_EVENT, {
      eventName: "minister.password_reset",
      kind: "user",
      severity: "warning",
      title: "Minister password reset",
      message: `Login password was reset for ${name}.`,
      href: `/ministers/details/${id}`,
      dedupeKey: `minister.password_reset:${id}:${Date.now()}`,
      targetRoles: ["admin"],
    });

    return { temporary_password: temporaryPassword };
  }

  async remove(id: string, actingUser?: Partial<User>): Promise<void> {
    const minister = await this.findOne(id);
    const userId = minister.user_id;
    const name = `${minister.first_name} ${minister.last_name}`.trim();

    await this.ministersRepository.delete(id);
    try {
      await this.usersService.remove(userId, actingUser);
    } catch {
      // User may already be gone
    }

    this.events.emit(NOTIFICATION_EVENT, {
      eventName: "minister.deleted",
      kind: "user",
      severity: "warning",
      title: "Minister removed",
      message: `${name} and their login account were removed.`,
      dedupeKey: `minister.deleted:${id}`,
      targetRoles: ["admin"],
    });
  }
}
