import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { UuidPrimary } from "../../../common/entities/uuid-primary";
import { HomeGroupMember } from "./home-group-member.entity";
import type {
  LeaderSummary,
  LeaderType,
} from "../../../common/leadership/leader.types";

@Entity("home_groups")
@Index("IDX_home_groups_leader_id", ["leader_id"])
export class HomeGroup extends UuidPrimary {

  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  about: string | null;

  @Column({ type: "varchar", nullable: true })
  schedule: string | null;

  @Column()
  location: string;

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

  @OneToMany(
    () => HomeGroupMember,
    (homeGroupMember) => homeGroupMember.home_group,
  )
  home_group_members: HomeGroupMember[];
}
