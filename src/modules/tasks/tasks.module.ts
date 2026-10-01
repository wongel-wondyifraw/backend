import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TasksService } from "./tasks.service";
import { TasksController } from "./tasks.controller";
import { TaskDefinition } from "./entities/task-definition.entity";
import { Task } from "./entities/task.entity";
import { Minister } from "../ministers/entities/minister.entity";
import { NotificationsModule } from "../notifications/notifications.module";

import { Member } from "../members/entities/member.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskDefinition, Task, Minister, Member]),
    NotificationsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
