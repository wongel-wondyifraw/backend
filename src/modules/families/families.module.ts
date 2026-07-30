import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamiliesService } from './families.service';
import { FamiliesController } from './families.controller';
import { Family } from './entities/family.entity';
import { FamilyChild } from './entities/family-child.entity';
import { Member } from '../members/entities/member.entity';
import { Minister } from '../ministers/entities/minister.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Family, FamilyChild, Member, Minister])],
  controllers: [FamiliesController],
  providers: [FamiliesService],
  exports: [FamiliesService],
})
export class FamiliesModule {}
