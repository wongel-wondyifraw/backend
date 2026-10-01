import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Permission } from "./entities/permission.entity";
import { Role } from "./entities/role.entity";
import { User } from "../users/entities/user.entity";
import { AccessSeederService } from "./access.seeder.service";
import { AccessController } from "./access.controller";
import { AccessService } from "./access.service";

@Module({
  imports: [TypeOrmModule.forFeature([Permission, Role, User])],
  controllers: [AccessController],
  providers: [AccessSeederService, AccessService],
  exports: [AccessSeederService, AccessService, TypeOrmModule],
})
export class AccessModule {}
