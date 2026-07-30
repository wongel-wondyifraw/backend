import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { FamilyChild } from './family-child.entity';

@Entity('families')
export class Family {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'uuid' })
  husband_id: string;

  @Column({ type: 'varchar', length: 16, default: 'member' })
  husband_type: 'member' | 'minister';

  @Column({ type: 'uuid' })
  wife_id: string;

  @Column({ type: 'varchar', length: 16, default: 'member' })
  wife_type: 'member' | 'minister';

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => FamilyChild, (child) => child.family, { cascade: true })
  children: FamilyChild[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  /** Resolved at runtime — not DB columns */
  husband?: {
    id: string;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    email?: string | null;
    phone?: string | null;
    type: 'member' | 'minister';
    gender?: string | null;
    marital_status?: string | null;
  } | null;

  wife?: {
    id: string;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    email?: string | null;
    phone?: string | null;
    type: 'member' | 'minister';
    gender?: string | null;
    marital_status?: string | null;
  } | null;
}
