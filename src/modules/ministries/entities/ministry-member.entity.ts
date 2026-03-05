import { Entity, Column, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Ministry } from './ministry.entity';
import { Member } from '../../members/entities/member.entity';

@Entity('ministry_members')
export class MinistryMember {
    @PrimaryColumn('uuid')
    ministry_id: string;

    @PrimaryColumn('uuid')
    member_id: string;

    @CreateDateColumn()
    joined_at: Date;

    @ManyToOne(() => Ministry, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ministry_id' })
    ministry: Ministry;

    @ManyToOne(() => Member, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'member_id' })
    member: Member;
}
