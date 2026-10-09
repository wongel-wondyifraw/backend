import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { UuidPrimary } from "../../../common/entities/uuid-primary";

@Entity("password_reset_tokens")
export class PasswordResetToken extends UuidPrimary {

  @Index()
  @Column()
  user_id: string;

  @Column({ type: "text" })
  token_hash: string;

  @Column()
  expires_at: Date;

  @Column({ nullable: true })
  used_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
}
