import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { UuidPrimary } from "../../../common/entities/uuid-primary";

export type ContactRequestCategory =
  "prayer" | "cell" | "baptism" | "counseling" | "chms" | "general";

export type ContactRequestStatus =
  "new" | "read" | "in_progress" | "responded" | "archived";

@Entity("contact_requests")
@Index(["status", "created_at"])
export class ContactRequest extends UuidPrimary {

  @Column({ type: "varchar", length: 200 })
  full_name: string;

  @Column({ type: "varchar", length: 50 })
  phone: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email: string | null;

  @Column({ type: "varchar", length: 50, default: "general" })
  category: ContactRequestCategory;

  @Column({ type: "text" })
  message: string;

  @Column({ type: "boolean", default: false })
  is_confidential: boolean;

  @Column({ type: "varchar", length: 30, default: "new" })
  status: ContactRequestStatus;

  @Column({ type: "uuid", nullable: true })
  assigned_to: string | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @Column({ type: "timestamptz", nullable: true })
  responded_at: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
