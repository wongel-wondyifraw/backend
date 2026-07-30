import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { MinistryMember } from '../../ministries/entities/ministry-member.entity';

@Entity('members')
export class Member {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    first_name: string;

    @Column({ nullable: true })
    middle_name: string;

    @Column()
    last_name: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    image_url: string;

    @Column({ nullable: true })
    address: string;

    @Column({ type: 'date', nullable: true })
    date_of_birth: Date;

    @Column({ nullable: true })
    marital_status: string;

    @Column({ type: 'varchar', nullable: true })
    gender: string | null;

    @Column({ default: 'active' })
    status: string;

    @Column({ default: false })
    baptized: boolean;

    @Column({ type: 'date', nullable: true })
    joined_date: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => MinistryMember, (ministryMember) => ministryMember.member)
    ministry_members: MinistryMember[];
}

