import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { User } from '../users/entities/user.entity';
import { AccessSeederService } from './access.seeder.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SYSTEM_ROLE_ADMIN_KEY } from './access.types';

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly seeder: AccessSeederService,
  ) {}

  async listRoles() {
    return this.roles.find({
      relations: { permissions: true },
      order: { name: 'ASC' },
    });
  }

  async findRole(id: string) {
    const role = await this.roles.findOne({
      where: { id },
      relations: { permissions: true },
    });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    return role;
  }

  async listPermissions() {
    return this.seeder.findAllPermissions();
  }

  async listPermissionsGrouped(): Promise<Record<string, Permission[]>> {
    const all = await this.seeder.findAllPermissions();
    const grouped: Record<string, Permission[]> = {};
    for (const p of all) {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    }
    return grouped;
  }

  async findRoleByKey(key: string) {
    return this.seeder.findRoleByKey(key);
  }

  async createRole(dto: CreateRoleDto) {
    const existing = await this.roles.findOne({ where: { key: dto.key } });
    if (existing) {
      throw new ConflictException(`Role key "${dto.key}" is already in use`);
    }
    const perms = await this.resolvePermissionSlugs(dto.permissionSlugs);
    const role = this.roles.create({
      key: dto.key,
      name: dto.name,
      description: dto.description ?? null,
      is_system: false,
      permissions: perms,
    });
    return this.roles.save(role);
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    const role = await this.findRole(id);

    if (dto.name !== undefined) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description ?? null;

    if (dto.permissionSlugs !== undefined) {
      if (role.key === SYSTEM_ROLE_ADMIN_KEY) {
        role.permissions = await this.seeder.findAllPermissions();
      } else {
        role.permissions = await this.resolvePermissionSlugs(dto.permissionSlugs);
      }
    }

    return this.roles.save(role);
  }

  async removeRole(id: string): Promise<void> {
    const role = await this.findRole(id);
    if (role.is_system) {
      throw new BadRequestException('System roles cannot be deleted');
    }
    const userCount = await this.users.count({ where: { role_id: role.id } });
    if (userCount > 0) {
      throw new ConflictException(
        `Role is assigned to ${userCount} user(s) and cannot be deleted`,
      );
    }
    await this.roles.remove(role);
  }

  private async resolvePermissionSlugs(slugs: string[]): Promise<Permission[]> {
    if (slugs.length === 0) return [];
    const found = await this.permissions
      .createQueryBuilder('p')
      .where('p.slug IN (:...slugs)', { slugs })
      .getMany();
    if (found.length !== slugs.length) {
      const foundSet = new Set(found.map((p) => p.slug));
      const missing = slugs.filter((s) => !foundSet.has(s));
      throw new NotFoundException(
        `Unknown permission slug(s): ${missing.join(', ')}`,
      );
    }
    return found;
  }
}
