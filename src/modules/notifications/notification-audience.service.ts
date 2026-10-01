import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { User } from "../users/entities/user.entity";

@Injectable()
export class NotificationAudienceService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async resolveRecipients(options: {
    targetRoles?: string[];
    includeAdmins?: boolean;
    excludeUserId?: string;
  }): Promise<User[]> {
    const roleKeys = new Set<string>(
      options.targetRoles ?? ["admin", "minister"],
    );
    if (options.includeAdmins !== false) {
      roleKeys.add("admin");
    }

    const users = await this.users.find({
      where: { is_active: true },
      relations: { roleEntity: true },
    });

    return users.filter((u) => {
      if (options.excludeUserId && u.id === options.excludeUserId) return false;
      const key = u.roleEntity?.key ?? u.role;
      return key && roleKeys.has(key);
    });
  }
}
