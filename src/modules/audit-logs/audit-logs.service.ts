import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "./entities/audit-log.entity";

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogsRepo: Repository<AuditLog>,
  ) {}

  async logAction(
    action: string,
    entity_type: string,
    entity_id: string,
    user_id: string | null,
    changes?: Record<string, unknown>,
  ): Promise<AuditLog> {
    const log = this.auditLogsRepo.create({
      action,
      entity_type,
      entity_id,
      user_id,
      changes,
    });
    return this.auditLogsRepo.save(log);
  }

  async findByEntity(
    entity_type: string,
    entity_id: string,
  ): Promise<AuditLog[]> {
    return this.auditLogsRepo.find({
      where: { entity_type, entity_id },
      order: { created_at: "DESC" },
    });
  }
}
