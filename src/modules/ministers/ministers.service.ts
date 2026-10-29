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

    const user = await this.usersService.create(
      {
        first_name: dto.first_name,
        middle_name: dto.middle_name ?? "",
        last_name: dto.last_name,
        email,
        password: temporaryPassword,
        role: "minister",
        title: dto.title ?? undefined,
        avatar_url: dto.image_url ?? undefined,
        is_active: isActive,
        created_via: "minister_module",
      },
      actingUser,
    );

    const minister = this.ministersRepository.create({
      ...dto,
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
    await this.ministersRepository.update(id, dto);

    const userPatch: Record<string, unknown> = {};
    if (dto.first_name !== undefined) userPatch.first_name = dto.first_name;
    if (dto.middle_name !== undefined) userPatch.middle_name = dto.middle_name;
    if (dto.last_name !== undefined) userPatch.last_name = dto.last_name;
    if (dto.title !== undefined) userPatch.title = dto.title;
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
