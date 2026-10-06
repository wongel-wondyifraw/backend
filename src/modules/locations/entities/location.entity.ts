import { Entity, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { UuidPrimary } from "../../../common/entities/uuid-primary";

@Entity("locations")
export class Location extends UuidPrimary {

  @Column({ unique: true })
  name: string;

  @Column({ default: "active" })
  status: string;

  @Column({ type: "uuid", nullable: true })
  parent_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
