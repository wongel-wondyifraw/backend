import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { FamilyChild } from "./family-child.entity";

@Entity("families")
@Index("IDX_families_husband_id", ["husband_id"])
@Index("IDX_families_wife_id", ["wife_id"])
export class Family {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", nullable: true })
  name: string | null;

  @Column({ type: "uuid", nullable: true })
  husband_id: string | null;

  @Column({ type: "varchar", length: 16, default: "member" })
  husband_type: "member" | "minister";

  @Column({ type: "uuid", nullable: true })
  wife_id: string | null;

  @Column({ type: "varchar", length: 16, default: "member" })
  wife_type: "member" | "minister";

  @Column({ type: "varchar", default: "registered" })
  spouse_status: string; // 'registered' | 'pending' | 'external' | 'none'

  @Column({ type: "varchar", nullable: true })
  external_spouse_name: string | null;

  @Column({ type: "varchar", nullable: true })
  external_spouse_phone: string | null;

  @Column({ type: "varchar", nullable: true })
  external_spouse_church: string | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @OneToMany(() => FamilyChild, (child) => child.family, { cascade: true })
  children: FamilyChild[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  /** Resolved at runtime — not DB columns */
  husband?: {
    id: string;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    email?: string | null;
    phone?: string | null;
    type: "member" | "minister";
    gender?: string | null;
    marital_status?: string | null;
  } | null;

  wife?: {
    id: string;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    email?: string | null;
    phone?: string | null;
    type: "member" | "minister";
    gender?: string | null;
    marital_status?: string | null;
  } | null;
}
