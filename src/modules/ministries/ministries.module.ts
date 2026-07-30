import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MinistriesService } from './ministries.service';
import { MinistriesController } from './ministries.controller';
import { Ministry } from './entities/ministry.entity';
import { MinistryMember } from './entities/ministry-member.entity';
import { LeadershipModule } from '../../common/leadership/leadership.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ministry, MinistryMember]), LeadershipModule],
  controllers: [MinistriesController],
  providers: [MinistriesService],
  exports: [MinistriesService],
})
export class MinistriesModule {}
