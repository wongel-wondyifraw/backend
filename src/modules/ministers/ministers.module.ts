import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MinistersService } from './ministers.service';
import { MinistersController } from './ministers.controller';
import { Minister } from './entities/minister.entity';
import { Member } from '../members/entities/member.entity';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Minister, Member, User])],
    controllers: [MinistersController],
    providers: [MinistersService],
    exports: [MinistersService],
})
export class MinistersModule { }
