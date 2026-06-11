import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum NotificationKind {
  MEMBER = 'member',
  MINISTRY = 'ministry',
  SYSTEM = 'system',
  USER = 'user',
}

export enum NotificationSeverity {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  DANGER = 'danger',
}

@Entity('notifications')
@Index(['user_id', 'created_at'])
@Index(['user_id', 'read_at'])
@Index(['user_id', 'dismissed_at'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 32 })
  kind: NotificationKind;

  @Column({ type: 'varchar', length: 16 })
  severity: NotificationSeverity;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', nullable: true })
  href: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true })
  dedupe_key: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  read_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  dismissed_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
