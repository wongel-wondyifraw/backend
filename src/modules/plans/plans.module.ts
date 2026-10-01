import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlansService } from "./plans.service";
import { PlansController } from "./plans.controller";
import { Plan } from "./entities/plan.entity";
import { PlanMinister } from "./entities/plan-minister.entity";
import { Minister } from "../ministers/entities/minister.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Plan, PlanMinister, Minister])],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
