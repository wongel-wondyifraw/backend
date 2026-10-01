import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TaskDefinition } from "./entities/task-definition.entity";
import { Task } from "./entities/task.entity";
import { CreateTaskDefinitionDto } from "./dto/create-task-definition.dto";
import { UpdateTaskDefinitionDto } from "./dto/update-task-definition.dto";
import { Member } from "../members/entities/member.entity";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TaskQueryDto } from "./dto/task-query.dto";
import { PaginatedResult } from "../../common/interfaces/paginated-result.interface";
import { Minister } from "../ministers/entities/minister.entity";
import { NotificationsService } from "../notifications/notifications.service";
import {
  NotificationKind,
  NotificationSeverity,
} from "../notifications/entities/notification.entity";

export const HOME_VISIT_CODE = "HOME_VISIT";

@Injectable()
export class TasksService implements OnModuleInit {
  constructor(
    @InjectRepository(TaskDefinition)
    private readonly definitions: Repository<TaskDefinition>,
    @InjectRepository(Task)
    private readonly tasks: Repository<Task>,
    @InjectRepository(Minister)
    private readonly ministers: Repository<Minister>,
    @InjectRepository(Member)
    private readonly members: Repository<Member>,
    private readonly notifications: NotificationsService,
  ) {}

  async onModuleInit() {
    await this.ensureHomeVisitDefinition();
  }

  private async ensureHomeVisitDefinition() {
    const existing = await this.definitions.findOne({
      where: { code: HOME_VISIT_CODE },
    });
    if (existing) return;
    await this.definitions.save(
      this.definitions.create({
        name: "Home Visit",
        description:
          "Visit a church member at their home. Requires selecting who to visit.",
        code: HOME_VISIT_CODE,
        requires_visit_target: true,
        is_system: true,
        is_active: true,
      }),
    );
  }

  // --- Definitions ---

  async listDefinitions(activeOnly = false): Promise<TaskDefinition[]> {
    const where = activeOnly ? { is_active: true } : {};
    return this.definitions.find({
      where,
      order: { is_system: "DESC", name: "ASC" },
    });
  }

  async createDefinition(
    dto: CreateTaskDefinitionDto,
  ): Promise<TaskDefinition> {
    const def = this.definitions.create({
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      requires_visit_target: dto.requires_visit_target ?? false,
      is_active: dto.is_active ?? true,
      is_system: false,
      code: null,
    });
    return this.definitions.save(def);
  }

  async updateDefinition(
    id: string,
    dto: UpdateTaskDefinitionDto,
  ): Promise<TaskDefinition> {
    const def = await this.definitions.findOne({ where: { id } });
    if (!def) throw new NotFoundException("Task definition not found");
    if (def.is_system && dto.requires_visit_target === false) {
      throw new BadRequestException("Home Visit must require a visit target");
    }
    if (dto.name !== undefined) def.name = dto.name.trim();
    if (dto.description !== undefined)
      def.description = dto.description?.trim() || null;
    if (dto.requires_visit_target !== undefined && !def.is_system) {
      def.requires_visit_target = dto.requires_visit_target;
    }
    if (dto.is_active !== undefined) def.is_active = dto.is_active;
    return this.definitions.save(def);
  }

  async removeDefinition(id: string): Promise<void> {
    const def = await this.definitions.findOne({ where: { id } });
    if (!def) throw new NotFoundException("Task definition not found");
    if (def.is_system) {
      throw new BadRequestException(
        "System task definitions cannot be deleted",
      );
    }
    const inUse = await this.tasks.count({ where: { definition_id: id } });
    if (inUse > 0) {
      throw new BadRequestException(
        "Cannot delete a definition that has assigned tasks. Deactivate it instead.",
      );
    }
    await this.definitions.delete(id);
  }

  // --- Tasks ---

  private taskRelations = {
    definition: true,
    minister: true,
    target_member: true,
    assigned_by: true,
  } as const;

  async createTask(
    dto: CreateTaskDto,
    assignedByUserId: string,
  ): Promise<Task> {
    const definition = await this.definitions.findOne({
      where: { id: dto.definition_id },
    });
    if (!definition || !definition.is_active) {
      throw new BadRequestException("Task definition not found or inactive");
    }

    if (new Date(dto.end_date) < new Date(dto.start_date)) {
      throw new BadRequestException("End date must be on or after start date");
    }

    if (definition.requires_visit_target && !dto.target_member_id) {
      throw new BadRequestException(
        "This task requires selecting who to visit",
      );
    }

    const minister = await this.ministers.findOne({
      where: { id: dto.minister_id },
    });
    if (!minister) throw new BadRequestException("Minister not found");

    const task = this.tasks.create({
      definition_id: dto.definition_id,
      minister_id: dto.minister_id,
      assigned_by_user_id: assignedByUserId,
      start_date: dto.start_date,
      end_date: dto.end_date,
      target_member_id: definition.requires_visit_target
        ? dto.target_member_id!
        : null,
      notes: dto.notes?.trim() || null,
      status: "pending",
      visitation_methods: dto.visitation_methods || [],
    });
    const saved = await this.tasks.save(task);

    if (minister.user_id) {
      await this.notifications.create({
        userId: minister.user_id,
        kind: NotificationKind.SYSTEM,
        severity: NotificationSeverity.INFO,
        title: "New task assigned",
        message: `${definition.name} was assigned to you (${dto.start_date} → ${dto.end_date}).`,
        href: "/dashboard",
        dedupeKey: `task.assigned:${saved.id}`,
      });
    }

    return this.findOne(saved.id);
  }

  async findAll(query: TaskQueryDto): Promise<PaginatedResult<Task>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.tasks
      .createQueryBuilder("task")
      .leftJoinAndSelect("task.definition", "definition")
      .leftJoinAndSelect("task.minister", "minister")
      .leftJoinAndSelect("task.target_member", "target_member")
      .leftJoinAndSelect("task.assigned_by", "assigned_by");

    if (query.minister_id) {
      qb.andWhere("task.minister_id = :ministerId", {
        ministerId: query.minister_id,
      });
    }
    if (query.definition_id) {
      qb.andWhere("task.definition_id = :definitionId", {
        definitionId: query.definition_id,
      });
    }

    const status = query.status ?? "all";
    const today = new Date().toISOString().slice(0, 10);
    if (status === "pending") {
      qb.andWhere("task.status = :s", { s: "pending" });
    } else if (status === "completed") {
      qb.andWhere("task.status = :s", { s: "completed" });
    } else if (status === "cancelled") {
      qb.andWhere("task.status = :s", { s: "cancelled" });
    } else if (status === "overdue") {
      qb.andWhere("task.status = :s AND task.end_date < :today", {
        s: "pending",
        today,
      });
    }

    if (query.search?.trim()) {
      const pattern = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(definition.name) LIKE :pattern OR LOWER(minister.first_name) LIKE :pattern OR LOWER(minister.last_name) LIKE :pattern OR LOWER(COALESCE(target_member.first_name, '')) LIKE :pattern)`,
        { pattern },
      );
    }

    qb.orderBy("task.created_at", "DESC");
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasks.findOne({
      where: { id },
      relations: this.taskRelations,
    });
    if (!task) throw new NotFoundException("Task not found");
    return task;
  }

  async findMine(userId: string, status?: string): Promise<Task[]> {
    const minister = await this.ministers.findOne({
      where: { user_id: userId },
    });
    if (!minister) return [];

    const qb = this.tasks
      .createQueryBuilder("task")
      .leftJoinAndSelect("task.definition", "definition")
      .leftJoinAndSelect("task.target_member", "target_member")
      .leftJoinAndSelect("task.minister", "minister")
      .where("task.minister_id = :ministerId", { ministerId: minister.id });

    if (status === "completed") {
      qb.andWhere("task.status = :s", { s: "completed" });
    } else if (status === "all") {
      qb.andWhere("task.status IN (:...statuses)", {
        statuses: ["pending", "completed"],
      });
    } else {
      qb.andWhere("task.status = :s", { s: "pending" });
    }

    qb.orderBy(
      `CASE WHEN task.status = 'pending' THEN 0 ELSE 1 END`,
      "ASC",
    ).addOrderBy("task.end_date", "ASC");
    return qb.getMany();
  }

  async complete(id: string, userId: string, isAdmin: boolean): Promise<Task> {
    const task = await this.findOne(id);
    if (task.status === "completed") return task;

    const minister = await this.ministers.findOne({
      where: { user_id: userId },
    });
    const isAssignee = !!minister && minister.id === task.minister_id;
    if (!isAdmin && !isAssignee) {
      throw new ForbiddenException(
        "You can only complete tasks assigned to you",
      );
    }

    task.status = "completed";
    task.completed_at = new Date();
    await this.tasks.save(task);

    if (task.target_member_id) {
      await this.members.increment(
        { id: task.target_member_id },
        "visit_count",
        1,
      );
    }

    return this.findOne(id);
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    if (dto.minister_id !== undefined) task.minister_id = dto.minister_id;
    if (dto.start_date !== undefined) task.start_date = dto.start_date;
    if (dto.end_date !== undefined) task.end_date = dto.end_date;
    if (dto.notes !== undefined) task.notes = dto.notes?.trim() || null;
    if (dto.target_member_id !== undefined)
      task.target_member_id = dto.target_member_id;
    if (dto.visitation_methods !== undefined)
      task.visitation_methods = dto.visitation_methods;

    let justCompleted = false;
    if (dto.status !== undefined && task.status !== dto.status) {
      if (dto.status === "completed") justCompleted = true;
      task.status = dto.status;
      task.completed_at = dto.status === "completed" ? new Date() : null;
    }

    if (new Date(task.end_date) < new Date(task.start_date)) {
      throw new BadRequestException("End date must be on or after start date");
    }

    if (task.definition.requires_visit_target && !task.target_member_id) {
      throw new BadRequestException(
        "This task requires selecting who to visit",
      );
    }

    await this.tasks.save(task);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.tasks.delete(id);
    if (result.affected === 0) throw new NotFoundException("Task not found");
  }
}
