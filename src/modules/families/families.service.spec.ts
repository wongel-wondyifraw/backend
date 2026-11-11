import { DataSource, Repository } from "typeorm";
import { FamiliesService } from "./families.service";
import { Family } from "./entities/family.entity";
import { FamilyChild } from "./entities/family-child.entity";
import { Member } from "../members/entities/member.entity";
import { Minister } from "../ministers/entities/minister.entity";

describe("FamiliesService (Data Quality & Dual Calendar)", () => {
  let service: FamiliesService;
  let families: { findOne: jest.Mock };
  let children: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock };
  let members: { findOne: jest.Mock };
  let ministers: { findOne: jest.Mock };

  beforeEach(() => {
    families = { findOne: jest.fn() };
    children = {
      create: jest.fn((v) => v as FamilyChild),
      save: jest.fn(async (v) => v as FamilyChild),
      findOne: jest.fn(),
    };
    members = { findOne: jest.fn() };
    ministers = { findOne: jest.fn() };

    service = new FamiliesService(
      families as unknown as Repository<Family>,
      children as unknown as Repository<FamilyChild>,
      members as unknown as Repository<Member>,
      ministers as unknown as Repository<Minister>,
      {} as unknown as DataSource,
    );
  });

  it("normalizes child name and resolves partial EC date_of_birth on addChild", async () => {
    families.findOne.mockResolvedValue({
      id: "fam-1",
      husband_id: "mem-1",
      husband_type: "member",
      wife_id: null,
      wife_type: "member",
      children: [],
    } as unknown as Family);
    members.findOne.mockResolvedValue({
      id: "mem-1",
      first_name: "Abebe",
      last_name: "Kebede",
    } as unknown as Member);

    const saved = await service.addChild("fam-1", {
      name: "samuel abebe",
      date_of_birth: "2010",
      date_of_birth_calendar: "ec",
    });

    expect(children.create).toHaveBeenCalledWith(
      expect.objectContaining({
        family_id: "fam-1",
        name: "Samuel Abebe",
        date_of_birth: "2017-09-11",
        date_of_birth_precision: "year",
        date_of_birth_calendar: "ec",
      }),
    );
    expect(typeof saved.age).toBe("number");
  });

  it("clears child date_of_birth and resets metadata on updateChild", async () => {
    children.findOne.mockResolvedValue({
      id: "child-1",
      family_id: "fam-1",
      name: "Samuel Abebe",
      age: 9,
      date_of_birth: "2017-09-11",
      date_of_birth_precision: "year",
      date_of_birth_calendar: "ec",
    } as unknown as FamilyChild);

    const updated = await service.updateChild("fam-1", "child-1", {
      name: "samuel abebe-bekele",
      date_of_birth: null,
    });

    expect(updated.name).toBe("Samuel Abebe-Bekele");
    expect(updated.date_of_birth).toBeNull();
    expect(updated.date_of_birth_precision).toBe("day");
    expect(updated.date_of_birth_calendar).toBe("gc");
  });
});
