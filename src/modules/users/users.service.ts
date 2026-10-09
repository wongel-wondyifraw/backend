import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { User } from "./entities/user.entity";
import { PasswordResetToken } from "../auth/entities/password-reset-token.entity";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { AccessSeederService } from "../access/access.seeder.service";
import { toUserResponse, UserResponseDto } from "./user.mapper";
import { NOTIFICATION_EVENT } from "../notifications/notification-events";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { AuditLog } from "../audit-logs/entities/audit-log.entity";
import { PaginatedResult } from "../../common/interfaces/paginated-result.interface";
import { randomBytes } from "crypto";

type CreateUserInput = Omit<CreateUserDto, "password_hash" | "avatar"> & {
  password_hash?: string;
  password?: string;
  avatar?: Express.Multer.File | string | null;
  avatar_url?: string | null;
  id?: string;
  created_at?: Date;
  created_via?: string;
};

type UpdateUserInput = Omit<UpdateUserDto, "avatar"> & {
  currentPassword?: string;
  newPassword?: string;
  avatar?: Express.Multer.File | string | null;
  avatar_url?: string | null;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly accessSeeder: AccessSeederService,
    private readonly events: EventEmitter2,
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
  ) {}

  private userRelations = { roleEntity: { permissions: true } };

  async create(
    createUserDto: CreateUserInput,
    actingUser?: Partial<User>,
  ): Promise<UserResponseDto> {
    const {
      password_hash,
      avatar: _avatar,
      avatar_url,
      password,
      role,
      ...rest
    } = createUserDto;

    const roleEntity = await this.accessSeeder.findRoleByKey(role ?? "staff");
    if (!roleEntity) {
      throw new NotFoundException(`Role "${role}" not found`);
    }

    if (
      roleEntity.key === "admin" &&
      actingUser &&
      actingUser.role !== "admin"
    ) {
      throw new ForbiddenException(
        "Only administrators can create admin users",
      );
    }

    const userData: Partial<User> = {
      ...rest,
      email: rest.email?.trim().toLowerCase(),
      avatar_url: avatar_url ?? undefined,
      role: roleEntity.key,
      role_id: roleEntity.id,
      roleEntity,
      is_active: rest.is_active === "true" || rest.is_active === true,
      created_at: createUserDto.created_at || new Date(),
    };

    const plainPassword =
      password_hash ?? password ?? randomBytes(16).toString("hex");
    if (plainPassword) {
      userData.password_hash = await this.hashPassword(plainPassword);
    }

    const user = this.usersRepository.create(userData);
    const saved = await this.usersRepository.save(user);

    await this.auditLogsService.logAction(
      "user.created",
      "user",
      saved.id,
      actingUser?.id || null,
      { email: saved.email, role: saved.role, created_via: saved.created_via },
    );

    this.events.emit(NOTIFICATION_EVENT, {
      eventName: "user.created",
      kind: "user",
      severity: "info",
      title: "New user account",
      message: `${saved.email} was added as ${roleEntity.key}.`,
      href: "/settings",
      dedupeKey: `user.created:${saved.id}`,
      targetRoles: ["admin"],
    });

    return toUserResponse(saved, true);
  }

  async setPasswordFromPlain(
    userId: string,
    plainPassword: string,
  ): Promise<void> {
    await this.usersRepository.update(userId, {
      password_hash: await this.hashPassword(plainPassword),
    });
  }

  private async hashPassword(value: string): Promise<string> {
    if (/^\$2[aby]?\$/.test(value)) {
      return value;
    }
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(value, salt);
  }

  async findAllPaginated(
    page = 1,
    limit = 20,
    search?: string,
    filters?: { role?: string; status?: string; origin?: string },
  ): Promise<PaginatedResult<UserResponseDto>> {
    const qb = this.usersRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.roleEntity", "roleEntity")
      .leftJoinAndSelect("roleEntity.permissions", "permissions");

    if (filters?.status === "deleted") {
      qb.withDeleted().andWhere("user.deleted_at IS NOT NULL");
    } else {
      if (filters?.status === "active") {
        qb.andWhere("user.is_active = true").andWhere(
          "(user.locked_until IS NULL OR user.locked_until < :now)",
          { now: new Date() },
        );
      } else if (filters?.status === "inactive") {
        qb.andWhere("user.is_active = false");
      } else if (filters?.status === "locked") {
        qb.andWhere("user.locked_until > :now", { now: new Date() });
      }
    }

    if (search?.trim()) {
      const pattern = `%${search.trim().toLowerCase()}%`;
      qb.andWhere(
        "(LOWER(user.first_name) LIKE :pattern OR LOWER(user.last_name) LIKE :pattern OR LOWER(user.email) LIKE :pattern OR LOWER(COALESCE(user.title, '')) LIKE :pattern)",
        { pattern },
      );
    }

    if (filters?.role) {
      qb.andWhere("user.role = :role", { role: filters.role });
    }

    if (filters?.origin) {
      qb.andWhere("user.created_via = :origin", { origin: filters.origin });
    }

    qb.orderBy("user.created_at", "DESC");
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((u) => toUserResponse(u, true)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(
    id: string,
    includePermissions = true,
  ): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: this.userRelations,
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return toUserResponse(user, includePermissions);
  }

  async findOneEntity(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: this.userRelations,
    });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();
    return this.usersRepository.findOne({
      where: { email: normalizedEmail },
      relations: this.userRelations,
      select: [
        "id",
        "email",
        "password_hash",
        "first_name",
        "middle_name",
        "last_name",
        "is_active",
        "created_at",
        "updated_at",
        "role",
        "role_id",
        "avatar_url",
        "title",
        "failed_login_attempts",
        "locked_until",
      ],
    });
  }

  async update(
    id: string,
    userData: UpdateUserInput,
    actingUser?: Partial<User>,
  ): Promise<UserResponseDto> {
    const {
      currentPassword,
      newPassword,
      role,
      avatar: _avatar,
      avatar_url,
      ...otherData
    } = userData;
    const updateObject: Partial<User> = {
      ...otherData,
      ...(avatar_url !== undefined
        ? { avatar_url: avatar_url ?? undefined }
        : {}),
    };

    if (role) {
      const roleEntity = await this.accessSeeder.findRoleByKey(role);
      if (!roleEntity) {
        throw new NotFoundException(`Role "${role}" not found`);
      }
      if (
        roleEntity.key === "admin" &&
        actingUser &&
        actingUser.role !== "admin"
      ) {
        throw new ForbiddenException(
          "Only administrators can assign the admin role",
        );
      }
      updateObject.role = roleEntity.key;
      updateObject.role_id = roleEntity.id;
    }

    if (currentPassword && newPassword) {
      const user = await this.usersRepository.findOne({
        where: { id },
        select: ["id", "password_hash"],
      });

      if (!user) {
        throw new NotFoundException("User not found");
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        throw new ForbiddenException("Current password is incorrect");
      }

      const salt = await bcrypt.genSalt(10);
      updateObject.password_hash = await bcrypt.hash(newPassword, salt);
    }

    await this.usersRepository.update(id, updateObject);

    await this.auditLogsService.logAction(
      "user.updated",
      "user",
      id,
      actingUser?.id || null,
      { ...updateObject, password_hash: undefined },
    );

    if (updateObject.is_active !== undefined) {
      await this.auditLogsService.logAction(
        updateObject.is_active ? "user.activated" : "user.deactivated",
        "user",
        id,
        actingUser?.id || null,
        { is_active: updateObject.is_active },
      );
    }

    return this.findOne(id);
  }

  async updateLoginStatus(
    id: string,
    status: {
      failed_login_attempts?: number;
      locked_until?: Date | null;
      last_login_at?: Date;
      email_verified_at?: Date | null;
    },
  ): Promise<void> {
    await this.usersRepository.update(id, status);
  }

  async updateMfaSecret(id: string, secret: string): Promise<void> {
    await this.usersRepository.update(id, { mfa_secret: secret });
  }

  async enableMfa(id: string): Promise<void> {
    await this.usersRepository.update(id, { mfa_enabled: true });
    await this.auditLogsService.logAction(
      "user.mfa_enabled",
      "user",
      id,
      id,
      {},
    );
  }

  async disableMfa(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      mfa_enabled: false,
      mfa_secret: null,
    });
    await this.auditLogsService.logAction(
      "user.mfa_disabled",
      "user",
      id,
      id,
      {},
    );
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<void> {
    await this.usersRepository.update(id, { avatar_url: avatarUrl });
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
    overrideCurrentPasswordCheck = false,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ["id", "password_hash"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!overrideCurrentPasswordCheck) {
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        throw new ForbiddenException("Current password is incorrect");
      }
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await this.usersRepository.update(userId, {
      password_hash: newHash,
      password_changed_at: new Date(),
    });

    await this.auditLogsService.logAction(
      "user.password_changed",
      "user",
      userId,
      userId,
      {},
    );

    return { message: "Password changed successfully" };
  }

  async adminResetPassword(
    id: string,
    actingUser: Partial<User>,
  ): Promise<{ temporary_password: string }> {
    const user = await this.findOneEntity(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    if (user.role === "admin" && actingUser.role !== "admin") {
      throw new ForbiddenException(
        "Only administrators can reset admin passwords",
      );
    }

    const temporaryPassword = randomBytes(12).toString("base64").slice(0, 16);

    await this.setPasswordFromPlain(id, temporaryPassword);

    await this.auditLogsService.logAction(
      "user.admin_password_reset",
      "user",
      id,
      actingUser.id || null,
      {},
    );

    return { temporary_password: temporaryPassword };
  }

  async forceLogout(
    id: string,
    actingUser: Partial<User>,
  ): Promise<{ message: string }> {
    const user = await this.findOneEntity(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    this.events.emit("user.force_logout", { userId: id });
    await this.auditLogsService.logAction(
      "user.force_logout",
      "user",
      id,
      actingUser.id || null,
      {},
    );

    return { message: "All sessions revoked" };
  }

  async exportData(id: string): Promise<{
    profile: {
      id: string;
      first_name: string;
      middle_name: string;
      last_name: string;
      email: string;
      title: string;
      created_at: Date;
      updated_at: Date;
      last_login_at: Date | null;
      created_via: string;
    };
    audit_logs: AuditLog[];
  }> {
    const user = await this.findOneEntity(id);
    if (!user) throw new NotFoundException("User not found");

    const logs = await this.auditLogsService.findByEntity("user", id);

    return {
      profile: {
        id: user.id,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        email: user.email,
        title: user.title,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at,
        created_via: user.created_via,
      },
      audit_logs: logs,
    };
  }

  async anonymize(id: string, actingUserId?: string): Promise<void> {
    const user = await this.findOneEntity(id);
    if (!user) throw new NotFoundException("User not found");

    if (user.role === "admin") {
      const activeAdmins = await this.usersRepository.count({
        where: { role: "admin", is_active: true, deleted_at: IsNull() },
      });
      if (activeAdmins <= 1) {
        throw new ConflictException(
          "Cannot anonymize the last active admin user",
        );
      }
    }

    await this.usersRepository.update(id, {
      first_name: "Anonymized",
      last_name: "User",
      middle_name: "",
      email: `anonymized-${id}@deleted.local`,
      avatar_url: "",
      title: "",
      is_active: false,
    });

    await this.usersRepository.softDelete(id);

    this.events.emit("user.deleted", { userId: id });

    await this.auditLogsService.logAction(
      "user.anonymized",
      "user",
      id,
      actingUserId || id,
      { message: "User PII anonymized according to GDPR right to erasure" },
    );
  }

  async remove(id: string, actingUser?: Partial<User>): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (actingUser?.id === id) {
      throw new BadRequestException("You cannot delete your own account");
    }

    if (user.role === "admin") {
      const adminCount = await this.usersRepository.count({
        where: { role: "admin", is_active: true },
      });
      if (adminCount <= 1) {
        throw new BadRequestException("Cannot remove the last administrator");
      }
    }

    const result = await this.usersRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.auditLogsService.logAction(
      "user.deleted",
      "user",
      id,
      actingUser?.id || null,
      { email: user.email },
    );
  }

  async restore(id: string, actingUser?: Partial<User>): Promise<void> {
    const result = await this.usersRepository.restore(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.auditLogsService.logAction(
      "user.restored",
      "user",
      id,
      actingUser?.id || null,
      {},
    );
  }

  async backfillRoleIds(): Promise<void> {
    const users = await this.usersRepository.find({ where: {} });
    for (const user of users) {
      if (user.role_id) continue;
      const key = user.role ?? "staff";
      const roleEntity = await this.accessSeeder.findRoleByKey(key);
      if (!roleEntity) continue;
      await this.usersRepository.update(user.id, {
        role_id: roleEntity.id,
        role: roleEntity.key,
      });
    }
  }

  async inviteUser(
    id: string,
    actingUser: Partial<User>,
  ): Promise<{ message: string }> {
    const user = await this.findOneEntity(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    if (user.role === "admin" && actingUser.role !== "admin") {
      throw new ForbiddenException(
        "Only administrators can invite admin users",
      );
    }

    const tokenPlain = randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(tokenPlain, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.passwordResetTokenRepository.save(
      this.passwordResetTokenRepository.create({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
    );

    await this.auditLogsService.logAction(
      "user.invited",
      "user",
      id,
      actingUser.id || null,
      {},
    );

    console.log(
      `[DEV] Invite link: http://localhost:3000/accept-invite?token=${tokenPlain}&email=${encodeURIComponent(user.email)}`,
    );

    return { message: "Invitation sent successfully" };
  }
}
