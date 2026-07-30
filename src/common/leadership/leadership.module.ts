import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../../modules/members/entities/member.entity';
import { Minister } from '../../modules/ministers/entities/minister.entity';
import { LeaderResolverService } from './leader-resolver.service';

@Module({
  imports: [TypeOrmModule.forFeature([Member, Minister])],
  providers: [LeaderResolverService],
  exports: [LeaderResolverService],
})
export class LeadershipModule {}
