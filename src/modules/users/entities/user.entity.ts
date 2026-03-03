import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

    @Column({ unique: true })
    email: string;

    @Column({ select: false }) // Password should not be selected by default
    password_hash: string;

    @Column({ default: true })
    is_active: boolean;
    @Column({ default: 'user' })
    role: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
