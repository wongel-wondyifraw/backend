import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { MinistryMember } from "../../ministries/entities/ministry-member.entity";
import { Location } from "../../locations/entities/location.entity";

@Entity("members")
@Index("IDX_members_status_created_at", ["status", "created_at"])
@Index("IDX_members_joined_date", ["joined_date"])
@Index("IDX_members_email", ["email"])
export class Member {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  first_name: string;

  @Column({ nullable: true })
  middle_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  image_url: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: "date", nullable: true })
  date_of_birth: Date;

  @Column({ nullable: true })
  marital_status: string;

  @Column({ type: "varchar", nullable: true })
  gender: string | null;

  @Column({ default: "pending" })
  status: string; // 'pending' | 'active' | 'inactive' | 'rejected'

  @Column({ type: "text", nullable: true })
  status_reason: string | null;

  @Column({ type: "uuid", nullable: true })
  approved_by_user_id: string | null;

  @Column({ type: "timestamptz", nullable: true })
  approved_at: Date | null;

  @Column({ default: false })
  baptized: boolean;

  @Column({ type: "date", nullable: true })
  joined_date: Date;

  @Column({ type: "varchar", nullable: true })
  telegram_username: string | null;

  @Column({ type: "varchar", nullable: true })
  facebook_username: string | null;

  @Column({ type: "varchar", nullable: true })
  instagram_username: string | null;

  @Column({ type: "varchar", nullable: true })
  whatsapp_number: string | null;

  @Column({ type: "varchar", default: "existing" })
  member_type: string; // 'existing' | 'baptized' | 'transferred'

  @Column({ type: "varchar", nullable: true })
  recommendation_letter_url: string | null;

  @Column({ default: false })
  requires_follow_up: boolean;

  @Column({ default: false })
  holy_spirit_baptized: boolean;

  @Column({ type: "date", nullable: true })
  salvation_date: Date | null;

  @Column({ type: "uuid", nullable: true })
  location_id: string | null;

  @ManyToOne(() => Location, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "location_id" })
  location: Location | null;

  @Column({ default: false })
  is_deacon: boolean;

  @Column({ default: 0 })
  visit_count: number;

  @Column({ type: "varchar", nullable: true })
  employment_status: string | null;

  @Column({ type: "varchar", nullable: true })
  profession: string | null;

  @Column({ type: "varchar", nullable: true })
  employer: string | null;

  @Column({ type: "varchar", nullable: true })
  education_level: string | null;

  @Column({ type: "varchar", nullable: true })
  education_field: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: "simple-array", nullable: true })
  interested_ministries: string[];

  @OneToMany(() => MinistryMember, (ministryMember) => ministryMember.member)
  ministry_members: MinistryMember[];
}
