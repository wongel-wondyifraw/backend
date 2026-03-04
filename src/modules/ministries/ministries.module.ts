import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MinistriesService } from './ministries.service';
import { MinistriesController } from './ministries.controller';
import { Ministry } from './entities/ministry.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Ministry])],
    controllers: [MinistriesController],
    providers: [MinistriesService],
    exports: [MinistriesService],
})
export class MinistriesModule { }
