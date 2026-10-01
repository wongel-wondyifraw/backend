import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("notification_preferences")
@Index(["user_id"], { unique: true })
export class NotificationPreference {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  user_id: string;

  @Column({ type: "boolean", default: true })
  enabled: boolean;

  @Column({ type: "jsonb", default: () => "'{}'" })
  kinds: Record<string, boolean>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
