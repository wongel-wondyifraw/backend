import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { MinistryMember } from "./ministry-member.entity";
import type {
  LeaderSummary,
  LeaderType,
} from "../../../common/leadership/leader.types";

@Entity("ministries")
@Index("IDX_ministries_leader_id", ["leader_id"])
export class Ministry {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  about: string | null;

  @Column({ type: "varchar", nullable: true })
  schedule: string | null;

  @Column({ type: "uuid", nullable: true })
  leader_id: string | null;

  @Column({ type: "varchar", length: 16, nullable: true })
  leader_type: LeaderType | null;

  /** Populated by service — not a DB column */
  leader?: LeaderSummary | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => MinistryMember, (ministryMember) => ministryMember.ministry)
  ministry_members: MinistryMember[];
}
