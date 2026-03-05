import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('ministry_members')
export class MinistryMember {
    @PrimaryColumn('uuid')
    ministry_id: string;

    @PrimaryColumn('uuid')
    member_id: string;

    @CreateDateColumn()
    joined_at: Date;
}
