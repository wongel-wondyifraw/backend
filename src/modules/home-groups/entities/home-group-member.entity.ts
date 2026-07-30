import { Entity, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { HomeGroup } from './home-group.entity';
import { Member } from '../../members/entities/member.entity';

@Entity('home_group_members')
export class HomeGroupMember {
  @PrimaryColumn('uuid')
  home_group_id: string;

  @PrimaryColumn('uuid')
  member_id: string;

  @CreateDateColumn()
  joined_at: Date;

  @ManyToOne(() => HomeGroup, (homeGroup) => homeGroup.home_group_members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'home_group_id' })
  home_group: HomeGroup;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: Member;
}
