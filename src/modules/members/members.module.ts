import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MembersService } from "./members.service";
import { MembersController } from "./members.controller";
import { Member } from "./entities/member.entity";
import { MinistriesModule } from "../ministries/ministries.module";

@Module({
  imports: [TypeOrmModule.forFeature([Member]), MinistriesModule],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
