import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TaskDefinition } from './task-definition.entity';
import { Minister } from '../../ministers/entities/minister.entity';
import { Member } from '../../members/entities/member.entity';
import { User } from '../../users/entities/user.entity';

export type TaskStatus = 'pending' | 'completed' | 'cancelled';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  definition_id: string;

  @ManyToOne(() => TaskDefinition, (def) => def.tasks, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'definition_id' })
  definition: TaskDefinition;

  @Column({ type: 'uuid' })
  minister_id: string;

  @ManyToOne(() => Minister, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'minister_id' })
  minister: Minister;

  @Column({ type: 'uuid', nullable: true })
  assigned_by_user_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_by_user_id' })
  assigned_by: User | null;

  /** Required when definition.requires_visit_target (Home Visit) */
  @Column({ type: 'uuid', nullable: true })
  target_member_id: string | null;

  @ManyToOne(() => Member, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'target_member_id' })
  target_member: Member | null;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  end_date: string;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: TaskStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
