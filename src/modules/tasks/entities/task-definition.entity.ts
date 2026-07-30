import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Task } from './task.entity';

@Entity('task_definitions')
export class TaskDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Stable code for system tasks, e.g. HOME_VISIT */
  @Column({ type: 'varchar', length: 64, nullable: true, unique: true })
  code: string | null;

  @Column({ default: false })
  requires_visit_target: boolean;

  @Column({ default: false })
  is_system: boolean;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Task, (task) => task.definition)
  tasks: Task[];
}
