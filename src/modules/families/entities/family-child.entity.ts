import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { UuidPrimary } from "../../../common/entities/uuid-primary";
import type {
  CalendarSystem,
  DatePrecision,
} from "../../../common/utils/ethiopian-calendar";
import { Family } from "./family.entity";

@Entity("family_children")
export class FamilyChild extends UuidPrimary {
  @Column({ type: "uuid" })
  family_id: string;

  @ManyToOne(() => Family, (family) => family.children, { onDelete: "CASCADE" })
  @JoinColumn({ name: "family_id" })
  family: Family;

  @Column()
  name: string;

  @Column({ type: "int", nullable: true })
  age: number | null;

  @Column({ type: "date", nullable: true })
  date_of_birth: Date | string | null;

  @Column({ type: "varchar", length: 10, default: "day" })
  date_of_birth_precision: DatePrecision;

  @Column({ type: "varchar", length: 4, default: "gc" })
  date_of_birth_calendar: CalendarSystem;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
