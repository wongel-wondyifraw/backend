import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Member } from '../../members/entities/member.entity';

@Entity('ministers')
export class Minister {
    @PrimaryGeneratedColumn('uuid')
    minister_id: string;

    @Column('uuid')
    user_id: string;

    @Column('uuid')
    member_id: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Member, { eager: true })
    @JoinColumn({ name: 'member_id' })
    member: Member;
}
