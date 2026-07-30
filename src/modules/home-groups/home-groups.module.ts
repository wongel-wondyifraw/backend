import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeGroupsService } from './home-groups.service';
import { HomeGroupsController } from './home-groups.controller';
import { HomeGroup } from './entities/home-group.entity';
import { HomeGroupMember } from './entities/home-group-member.entity';
import { LeadershipModule } from '../../common/leadership/leadership.module';

@Module({
  imports: [TypeOrmModule.forFeature([HomeGroup, HomeGroupMember]), LeadershipModule],
  controllers: [HomeGroupsController],
  providers: [HomeGroupsService],
  exports: [HomeGroupsService],
})
export class HomeGroupsModule {}
