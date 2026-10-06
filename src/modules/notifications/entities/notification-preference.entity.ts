import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  UpdateDateColumn,
} from "typeorm";
import { UuidPrimary } from "../../../common/entities/uuid-primary";

@Entity("notification_preferences")
@Index(["user_id"], { unique: true })
export class NotificationPreference extends UuidPrimary {

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
