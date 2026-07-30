import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BibleStudiesService } from './bible-studies.service';
import { BibleStudiesController } from './bible-studies.controller';
import { BibleStudy } from './entities/bible-study.entity';
import { BibleStudyMember } from './entities/bible-study-member.entity';
import { LeadershipModule } from '../../common/leadership/leadership.module';

@Module({
  imports: [TypeOrmModule.forFeature([BibleStudy, BibleStudyMember]), LeadershipModule],
  controllers: [BibleStudiesController],
  providers: [BibleStudiesService],
  exports: [BibleStudiesService],
})
export class BibleStudiesModule {}
