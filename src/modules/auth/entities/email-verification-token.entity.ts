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

@Entity("email_verification_tokens")
export class EmailVerificationToken extends UuidPrimary {

  @Index()
  @Column()
  user_id: string;

  @Column({ type: "text" })
  token_hash: string;

  @Column()
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
}
