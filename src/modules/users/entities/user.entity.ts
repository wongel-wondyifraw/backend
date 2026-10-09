import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { UuidPrimary } from "../../../common/entities/uuid-primary";
import { Role } from "../../access/entities/role.entity";

@Entity("users")
export class User extends UuidPrimary {
  @Column()
  first_name: string;

  @Column()
  middle_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ nullable: true })
  title: string;

  /** @deprecated Use roleEntity.key — kept for migration backfill */
  @Column({ nullable: true })
  role: string;

  @Column({ nullable: true })
  role_id: string;

  @ManyToOne(() => Role, (role) => role.users, { eager: false })
  @JoinColumn({ name: "role_id" })
  roleEntity: Role;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password_hash: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: "int", default: 0 })
  failed_login_attempts: number;

  @Column({ type: "timestamptz", nullable: true })
  locked_until: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  last_login_at: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  email_verified_at: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  password_changed_at: Date | null;

  @Column({ type: "varchar", default: "admin" })
  created_via: string; // 'admin' | 'minister_module' | 'self_registration' | 'invite'

  @Column({ type: "varchar", select: false, nullable: true })
  mfa_secret: string | null;

  @Column({ default: false })
  mfa_enabled: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
