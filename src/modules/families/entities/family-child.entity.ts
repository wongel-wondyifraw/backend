import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Family } from "./family.entity";

@Entity("family_children")
export class FamilyChild {
  @PrimaryGeneratedColumn("uuid")
  id: string;

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
  date_of_birth: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
