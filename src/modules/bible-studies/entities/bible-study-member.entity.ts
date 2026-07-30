import { Entity, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BibleStudy } from './bible-study.entity';
import { Member } from '../../members/entities/member.entity';

@Entity('bible_study_members')
export class BibleStudyMember {
  @PrimaryColumn('uuid')
  bible_study_id: string;

  @PrimaryColumn('uuid')
  member_id: string;

  @CreateDateColumn()
  joined_at: Date;

  @ManyToOne(() => BibleStudy, (study) => study.bible_study_members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bible_study_id' })
  bible_study: BibleStudy;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: Member;
}
