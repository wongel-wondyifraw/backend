import { Repository } from "typeorm";
import { PlansService } from "./plans.service";
import { Plan } from "./entities/plan.entity";
import { PlanMinister } from "./entities/plan-minister.entity";
import { Minister } from "../ministers/entities/minister.entity";

describe("PlansService (Dual Calendar)", () => {
  let service: PlansService;
  let plansRepo: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock };
  let planMinistersRepo: { delete: jest.Mock; create: jest.Mock; save: jest.Mock };
  let ministersRepo: { find: jest.Mock };

  beforeEach(() => {
    plansRepo = {
      create: jest.fn((v) => ({ ...(v as Plan), id: "plan-1" })),
      save: jest.fn(async (v) => v as Plan),
      findOne: jest.fn(),
    };
    planMinistersRepo = {
      delete: jest.fn(),
      create: jest.fn((v) => v as PlanMinister),
      save: jest.fn(),
    };
    ministersRepo = { find: jest.fn().mockResolvedValue([]) };

    service = new PlansService(
      plansRepo as unknown as Repository<Plan>,
      planMinistersRepo as unknown as Repository<PlanMinister>,
      ministersRepo as unknown as Repository<Minister>,
    );
  });

  it("converts an EC plan_date to canonical Gregorian DATE and preserves plan_date_calendar", async () => {
    plansRepo.findOne.mockResolvedValue({
      id: "plan-1",
      title: "Hidar Service",
      type: "program",
      plan_date: "2026-11-10",
      plan_date_calendar: "ec",
      plan_ministers: [],
    } as unknown as Plan);

    const created = await service.create({
      title: "Hidar Service",
      type: "program",
      plan_date: "2019-03-01",
      plan_date_calendar: "ec",
      minister_ids: [],
    });

    expect(plansRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_date: "2026-11-10",
        plan_date_calendar: "ec",
      }),
    );
    expect(created.plan_date_calendar).toBe("ec");
  });

  it("normalizes plan title and location initials on create and update", async () => {
    plansRepo.findOne
      .mockResolvedValueOnce({
        id: "plan-1",
        title: "IT Ministry Meeting",
        type: "program",
        plan_date: "2026-11-10",
        plan_date_calendar: "gc",
        location: "Main Hall",
        plan_ministers: [],
      } as unknown as Plan)
      .mockResolvedValueOnce({
        id: "plan-1",
        title: "IT Ministry Meeting",
        type: "program",
        plan_date: "2026-11-10",
        plan_date_calendar: "gc",
        location: "Main Hall",
        plan_ministers: [],
      } as unknown as Plan)
      .mockResolvedValueOnce({
        id: "plan-1",
        title: "Central Auditorium Retreat",
        type: "program",
        plan_date: "2026-11-10",
        plan_date_calendar: "gc",
        location: "Addis Ababa",
        plan_ministers: [],
      } as unknown as Plan);

    await service.create({
      title: "IT ministry meeting",
      type: "program",
      plan_date: "2026-11-10",
      plan_date_calendar: "gc",
      location: "main hall",
      minister_ids: [],
    });

    expect(plansRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "IT Ministry Meeting",
        location: "Main Hall",
      }),
    );

    await service.update("plan-1", {
      title: "CENTRAL auditorium RETREAT",
      location: "addis ababa",
    });

    expect(plansRepo.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: "Central Auditorium Retreat",
        location: "Addis Ababa",
      }),
    );
  });
});
