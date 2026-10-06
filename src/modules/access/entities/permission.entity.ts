import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToMany,
  UpdateDateColumn,
} from "typeorm";
import { UuidPrimary } from "../../../common/entities/uuid-primary";
import { Role } from "./role.entity";

@Entity("permissions")
export class Permission extends UuidPrimary {

  @Index({ unique: true })
  @Column({ type: "varchar", length: 128 })
  slug: string;

  @Column({ type: "varchar", length: 128 })
  name: string;

  @Column({ type: "varchar", length: 64 })
  category: string;

  @Column({ type: "varchar", length: 512, nullable: true })
  description: string | null;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
