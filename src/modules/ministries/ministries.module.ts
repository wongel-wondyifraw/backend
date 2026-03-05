import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MinistriesService } from './ministries.service';
import { MinistriesController } from './ministries.controller';
import { Ministry } from './entities/ministry.entity';
import { MinistryMember } from './entities/ministry-member.entity';
import { Member } from '../members/entities/member.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Ministry, MinistryMember, Member])],
    controllers: [MinistriesController],
    providers: [MinistriesService],
    exports: [MinistriesService],
})
export class MinistriesModule { }
