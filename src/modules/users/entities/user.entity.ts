import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from '../../access/entities/role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  first_name: string;

  @Column()
  middle_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ nullable: true })
  title: string;

  /** @deprecated Use roleEntity.key — kept for migration backfill */
  @Column({ nullable: true })
  role: string;

  @Column({ nullable: true })
  role_id: string;

  @ManyToOne(() => Role, (role) => role.users, { eager: false })
  @JoinColumn({ name: 'role_id' })
  roleEntity: Role;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password_hash: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
