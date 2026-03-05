import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Member } from '../../members/entities/member.entity';
import { MinistryMember } from './ministry-member.entity';

@Entity('ministries')
export class Ministry {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    about: string;

    @Column({ nullable: true })
    schedule: string;

    @Column({ type: 'uuid', nullable: true })
    leader_id: string;

    @ManyToOne(() => Member, (member) => member.led_ministries, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'leader_id' })
    leader: Member;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => MinistryMember, (ministryMember) => ministryMember.ministry)
    ministry_members: MinistryMember[];
}
