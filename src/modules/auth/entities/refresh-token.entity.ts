import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column()
  user_id: string;

  @Column({ type: "text" })
  token_hash: string;

  @Column({ nullable: true })
  device_info?: string;

  @Column({ nullable: true })
  ip_address?: string;

  @Column()
  expires_at: Date;

  @Column({ nullable: true })
  revoked_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
}
