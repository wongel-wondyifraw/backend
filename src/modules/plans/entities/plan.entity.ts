import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PlanMinister } from './plan-minister.entity';

export type PlanType =
  | 'program'
  | 'crusade'
  | 'general_assembly'
  | 'training'
  | 'fasting_day'
  | 'gospel_campaign';

export type PlanStatus = 'planned' | 'completed' | 'cancelled';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'varchar', length: 32 })
  type: PlanType;

  @Column({ type: 'date' })
  plan_date: string;

  @Column({ type: 'time', nullable: true })
  start_time: string | null;

  @Column({ type: 'time', nullable: true })
  end_time: string | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 16, default: 'planned' })
  status: PlanStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => PlanMinister, (pm) => pm.plan, { cascade: true })
  plan_ministers: PlanMinister[];
}
