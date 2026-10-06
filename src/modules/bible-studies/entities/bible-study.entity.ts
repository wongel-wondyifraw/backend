import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { UuidPrimary } from "../../../common/entities/uuid-primary";
import { BibleStudyMember } from "./bible-study-member.entity";
import type {
  LeaderSummary,
  LeaderType,
} from "../../../common/leadership/leader.types";

export type BibleStudyContentType = "book" | "study_material";

@Entity("bible_studies")
@Index("IDX_bible_studies_leader_id", ["leader_id"])
export class BibleStudy extends UuidPrimary {

  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  about: string | null;

  @Column({ type: "varchar", nullable: true })
  schedule: string | null;

  @Column()
  location: string;

  @Column({ type: "varchar", length: 32 })
  content_type: BibleStudyContentType;

  @Column({ type: "varchar", nullable: true })
  bible_book: string | null;

  @Column({ type: "varchar", nullable: true })
  material_url: string | null;

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

  @OneToMany(() => BibleStudyMember, (row) => row.bible_study)
  bible_study_members: BibleStudyMember[];
}
