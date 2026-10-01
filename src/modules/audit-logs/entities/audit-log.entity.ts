import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from "typeorm";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  action: string;

  @Column({ type: "varchar" })
  entity_type: string;

  @Column({ type: "uuid" })
  entity_id: string;

  @Column({ type: "uuid", nullable: true })
  user_id: string | null;

  @Column({ type: "jsonb", nullable: true })
  changes: any;

  @CreateDateColumn()
  created_at: Date;
}
