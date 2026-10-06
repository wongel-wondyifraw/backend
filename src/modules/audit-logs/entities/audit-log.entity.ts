import { Entity, Column, CreateDateColumn } from "typeorm";
import { UuidPrimary } from "../../../common/entities/uuid-primary";

@Entity("audit_logs")
export class AuditLog extends UuidPrimary {

  @Column()
  action: string;

  @Column({ type: "varchar" })
  entity_type: string;

  @Column({ type: "uuid" })
  entity_id: string;

  @Column({ type: "uuid", nullable: true })
  user_id: string | null;

  @Column({ type: "jsonb", nullable: true })
  changes: Record<string, unknown> | null;

  @CreateDateColumn()
  created_at: Date;
}
