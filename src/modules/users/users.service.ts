import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { User } from "./entities/user.entity";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { AccessSeederService } from "../access/access.seeder.service";
import { toUserResponse, UserResponseDto } from "./user.mapper";
import { NOTIFICATION_EVENT } from "../notifications/notification-events";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly accessSeeder: AccessSeederService,
    private readonly events: EventEmitter2,
  ) {}

  private userRelations = { roleEntity: { permissions: true } };

  async create(createUserDto: any): Promise<UserResponseDto> {
    const { password_hash, avatar, avatar_url, password, role, ...rest } =
      createUserDto;

    const roleEntity = await this.accessSeeder.findRoleByKey(role ?? "staff");
    if (!roleEntity) {
      throw new NotFoundException(`Role "${role}" not found`);
    }

    const userData: Partial<User> = {
      ...rest,
      email: rest.email?.trim().toLowerCase(),
      avatar_url: avatar_url,
      role: roleEntity.key,
      role_id: roleEntity.id,
      roleEntity,
      is_active: rest.is_active === "true" || rest.is_active === true,
      created_at: rest.created_at || new Date(),
    };

    const plainPassword = password_hash ?? password;
    if (plainPassword) {
      userData.password_hash = await this.hashPassword(plainPassword);
    }

    const user = this.usersRepository.create(userData);
    const saved = await this.usersRepository.save(user);

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

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find({
      relations: this.userRelations,
    });
    return users.map((u) => toUserResponse(u, true));
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
      ],
    });
  }

  async update(id: string, userData: any): Promise<UserResponseDto> {
    const { currentPassword, newPassword, role, ...otherData } = userData;
    const updateObject: Partial<User> = { ...otherData };

    if (role) {
      const roleEntity = await this.accessSeeder.findRoleByKey(role);
      if (!roleEntity) {
        throw new NotFoundException(`Role "${role}" not found`);
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
    return this.findOne(id);
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<void> {
    await this.usersRepository.update(id, { avatar_url: avatarUrl });
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.usersRepository.findOne({
      where: { id: userId },
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
    const newHash = await bcrypt.hash(newPassword, salt);

    await this.usersRepository.update(userId, { password_hash: newHash });

    return { message: "Password changed successfully" };
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
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
}
