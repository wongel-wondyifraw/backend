import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
} from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { CreateTaskDefinitionDto } from "./dto/create-task-definition.dto";
import { UpdateTaskDefinitionDto } from "./dto/update-task-definition.dto";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TaskQueryDto } from "./dto/task-query.dto";
import { RequiresPermissions } from "../../common/decorators/permissions.decorator";

@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // Definitions
  @Get("definitions")
  @RequiresPermissions("tasks.read")
  listDefinitions(@Query("activeOnly") activeOnly?: string) {
    return this.tasksService.listDefinitions(activeOnly === "true");
  }

  @Post("definitions")
  @RequiresPermissions("tasks.create")
  createDefinition(@Body() dto: CreateTaskDefinitionDto) {
    return this.tasksService.createDefinition(dto);
  }

  @Patch("definitions/:id")
  @RequiresPermissions("tasks.update")
  updateDefinition(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDefinitionDto,
  ) {
    return this.tasksService.updateDefinition(id, dto);
  }

  @Delete("definitions/:id")
  @RequiresPermissions("tasks.delete")
  removeDefinition(@Param("id", ParseUUIDPipe) id: string) {
    return this.tasksService.removeDefinition(id);
  }

  // Assignments
  @Get("mine")
  @RequiresPermissions("tasks.read")
  findMine(
    @Request() req: { user: { id: string } },
    @Query("status") status?: string,
  ) {
    return this.tasksService.findMine(req.user.id, status);
  }

  @Get()
  @RequiresPermissions("tasks.read")
  findAll(@Query() query: TaskQueryDto) {
    return this.tasksService.findAll(query);
  }

  @Get(":id")
  @RequiresPermissions("tasks.read")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id);
  }

  @Post()
  @RequiresPermissions("tasks.create")
  create(@Body() dto: CreateTaskDto, @Request() req: { user: { id: string } }) {
    return this.tasksService.createTask(dto, req.user.id);
  }

  @Patch(":id/complete")
  @RequiresPermissions("tasks.update")
  complete(
    @Param("id", ParseUUIDPipe) id: string,
    @Request()
    req: { user: { id: string; role?: string; roleEntity?: { key?: string } } },
  ) {
    const isAdmin =
      req.user.roleEntity?.key === "admin" || req.user.role === "admin";
    return this.tasksService.complete(id, req.user.id, isAdmin);
  }

  @Patch(":id")
  @RequiresPermissions("tasks.update")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Delete(":id")
  @RequiresPermissions("tasks.delete")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.tasksService.remove(id);
  }
}
