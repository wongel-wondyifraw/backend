import { Repository } from "typeorm";
import { TasksService } from "./tasks.service";
import { TaskDefinition } from "./entities/task-definition.entity";
import { Task } from "./entities/task.entity";
import { Minister } from "../ministers/entities/minister.entity";
import { Member } from "../members/entities/member.entity";
import { NotificationsService } from "../notifications/notifications.service";

describe("TasksService (Dual Calendar)", () => {
  let service: TasksService;
  let definitions: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let tasks: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock };
  let ministers: { findOne: jest.Mock };
  let members: { increment: jest.Mock };
  let notifications: { create: jest.Mock };

  beforeEach(() => {
    definitions = {
      findOne: jest.fn(),
      create: jest.fn((v) => ({ ...(v as TaskDefinition), id: "def-1" })),
      save: jest.fn(async (v) => v as TaskDefinition),
    };
    tasks = {
      create: jest.fn((v) => ({ ...(v as Task), id: "task-1" })),
      save: jest.fn(async (v) => v as Task),
      findOne: jest.fn(),
    };
    ministers = { findOne: jest.fn() };
    members = { increment: jest.fn() };
    notifications = { create: jest.fn() };

    service = new TasksService(
      definitions as unknown as Repository<TaskDefinition>,
      tasks as unknown as Repository<Task>,
      ministers as unknown as Repository<Minister>,
      members as unknown as Repository<Member>,
      notifications as unknown as NotificationsService,
    );
  });

  it("converts EC start_date and end_date to canonical Gregorian DATEs and preserves date_calendar", async () => {
    definitions.findOne.mockResolvedValue({
      id: "def-1",
      name: "Visitation",
      is_active: true,
      requires_visit_target: false,
    } as unknown as TaskDefinition);
    ministers.findOne.mockResolvedValue({
      id: "min-1",
      user_id: null,
    } as unknown as Minister);
    tasks.findOne.mockResolvedValue({
      id: "task-1",
      start_date: "2026-11-10",
      end_date: "2026-11-14",
      date_calendar: "ec",
    } as unknown as Task);

    const created = await service.createTask(
      {
        definition_id: "def-1",
        minister_id: "min-1",
        start_date: "2019-03-01",
        end_date: "2019-03-05",
        date_calendar: "ec",
      },
      "admin-1",
    );

    expect(tasks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        start_date: "2026-11-10",
        end_date: "2026-11-14",
        date_calendar: "ec",
      }),
    );
    expect(created.date_calendar).toBe("ec");
  });

  it("normalizes task definition names on createDefinition and updateDefinition", async () => {
    const createdDef = await service.createDefinition({
      name: "IT visit followup",
    });
    expect(createdDef.name).toBe("IT Visit Followup");

    definitions.findOne.mockResolvedValue({
      id: "def-1",
      name: "IT Visit Followup",
      is_system: false,
    } as unknown as TaskDefinition);
    const updatedDef = await service.updateDefinition("def-1", {
      name: "hospital PRAYER visit",
    });
    expect(updatedDef.name).toBe("Hospital Prayer Visit");
  });
});
