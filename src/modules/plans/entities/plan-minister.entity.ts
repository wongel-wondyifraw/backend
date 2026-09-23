import { Entity, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Plan } from './plan.entity';
import { Minister } from '../../ministers/entities/minister.entity';

@Entity('plan_ministers')
export class PlanMinister {
  @PrimaryColumn('uuid')
  plan_id: string;

  @PrimaryColumn('uuid')
  minister_id: string;

  @CreateDateColumn()
  assigned_at: Date;

  @ManyToOne(() => Plan, (plan) => plan.plan_ministers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @ManyToOne(() => Minister, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'minister_id' })
  minister: Minister;
}
