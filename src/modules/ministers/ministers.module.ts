import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MinistersService } from './ministers.service';
import { MinistersController } from './ministers.controller';
import { Minister } from './entities/minister.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Minister]), UsersModule],
  controllers: [MinistersController],
  providers: [MinistersService],
  exports: [MinistersService],
})
export class MinistersModule {}
