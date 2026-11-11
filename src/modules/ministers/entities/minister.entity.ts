import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { UuidPrimary } from "../../../common/entities/uuid-primary";
import type {
  CalendarSystem,
  DatePrecision,
} from "../../../common/utils/ethiopian-calendar";
import { User } from "../../users/entities/user.entity";

@Entity("ministers")
export class Minister extends UuidPrimary {
  @Column({ unique: true })
  user_id: string;

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column()
  first_name: string;

  @Column({ nullable: true })
  middle_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  image_url: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: "date", nullable: true })
  date_of_birth: Date | string | null;

  @Column({ type: "varchar", length: 10, default: "day" })
  date_of_birth_precision: DatePrecision;

  @Column({ type: "varchar", length: 4, default: "gc" })
  date_of_birth_calendar: CalendarSystem;

  @Column({ nullable: true })
  marital_status: string;

  @Column({ type: "varchar", nullable: true })
  gender: string | null;

  @Column({ nullable: true })
  title: string;

  @Column({ default: "active" })
  status: string;

  @Column({ type: "date", nullable: true })
  joined_date: Date | string | null;

  @Column({ type: "varchar", length: 10, default: "day" })
  joined_date_precision: DatePrecision;

  @Column({ type: "varchar", length: 4, default: "gc" })
  joined_date_calendar: CalendarSystem;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
