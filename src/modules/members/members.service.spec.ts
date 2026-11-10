import { NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Repository } from "typeorm";
import { MembersService } from "./members.service";
import { Member } from "./entities/member.entity";
import { NOTIFICATION_EVENT } from "../notifications/notification-events";

describe("MembersService", () => {
  let service: MembersService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let events: { emit: jest.Mock };

  const member = {
    id: "member-1",
    first_name: "John",
    middle_name: "",
    last_name: "Doe",
    email: "john@example.com",
    phone: undefined,
    image_url: undefined,
    address: undefined,
    date_of_birth: undefined,
    date_of_birth_precision: "day",
    date_of_birth_calendar: "gc",
    marital_status: undefined,
    status: "active",
    baptized: false,
    created_at: new Date(),
    updated_at: new Date(),
    ministry_members: [],
  } as unknown as Member;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    events = { emit: jest.fn() };

    service = new MembersService(
      repository as unknown as Repository<Member>,
      events as unknown as EventEmitter2,
    );
  });

  it("creates a member and emits notification event", async () => {
    const emailQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    repository.createQueryBuilder.mockReturnValue(emailQb as never);
    repository.create.mockReturnValue(member);
    repository.save.mockResolvedValue(member);

    const result = await service.create({
      first_name: "WONgel",
      last_name: "TesT",
      email: "john@example.com",
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: "Wongel",
        last_name: "Test",
      }),
    );
    expect(result).toEqual(member);
    expect(events.emit).toHaveBeenCalledWith(
      NOTIFICATION_EVENT,
      expect.objectContaining({
        eventName: "member.created",
        targetRoles: ["admin", "minister"],
      }),
    );
  });

  it("normalizes names and resolves partial/EC dates on create", async () => {
    const emailQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    repository.createQueryBuilder.mockReturnValue(emailQb as never);
    repository.create.mockImplementation((dto: Partial<Member>) => dto as Member);
    repository.save.mockImplementation(async (entity: Partial<Member>) => ({
      ...(entity as Member),
      id: "member-ec",
    }));

    const result = await service.create({
      first_name: "dawit",
      middle_name: "tesfaye",
      last_name: "ABebe",
      profession: "civil engineer",
      date_of_birth: "1984",
      date_of_birth_calendar: "ec",
      salvation_date: "1999-06",
      salvation_date_calendar: "ec",
      joined_date: "2019-03-01",
      joined_date_calendar: "ec",
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: "Dawit",
        middle_name: "Tesfaye",
        last_name: "Abebe",
        profession: "Civil Engineer",
        date_of_birth: "1991-09-12",
        date_of_birth_precision: "year",
        date_of_birth_calendar: "ec",
        salvation_date: "2007-02-08",
        salvation_date_precision: "month",
        salvation_date_calendar: "ec",
        joined_date: "2026-11-10",
        joined_date_precision: "day",
        joined_date_calendar: "ec",
      }),
    );
    expect(result.id).toBe("member-ec");
  });

  it("resolves clearing dates and metadata updates on update", async () => {
    repository.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
    repository.findOne.mockResolvedValue({
      ...member,
      first_name: "Martha",
      last_name: "O'Connor",
      date_of_birth: null,
    } as unknown as Member);

    await service.update("member-1", {
      first_name: "martha",
      last_name: "o'connor",
      date_of_birth: null,
      salvation_date: "2010",
      salvation_date_calendar: "gc",
    });

    expect(repository.update).toHaveBeenCalledWith(
      "member-1",
      expect.objectContaining({
        first_name: "Martha",
        last_name: "O'Connor",
        date_of_birth: null,
        date_of_birth_precision: "day",
        date_of_birth_calendar: "gc",
        salvation_date: "2010-01-01",
        salvation_date_precision: "year",
        salvation_date_calendar: "gc",
      }),
    );
  });

  it("throws when member is not found", async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne("missing-id")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("returns paginated members and resolves partial EC joined date range bounds", async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[member], 1]),
    };
    repository.createQueryBuilder.mockReturnValue(qb as never);

    const result = await service.findAllPaginated(1, 20, "john", {
      joined_from: "2015",
      joined_to: "2015",
      joined_calendar: "ec",
    });

    expect(result.data).toEqual([member]);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(qb.andWhere).toHaveBeenCalled();
    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining(">= :joinedFrom"),
      { joinedFrom: "2022-09-11" },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("<= :joinedTo"),
      { joinedTo: "2023-09-11" },
    );
  });

  it("deletes member and emits notification", async () => {
    repository.findOne.mockResolvedValue(member);
    repository.delete.mockResolvedValue({ affected: 1, raw: [] });

    await service.remove("member-1");

    expect(events.emit).toHaveBeenCalledWith(
      NOTIFICATION_EVENT,
      expect.objectContaining({ eventName: "member.deleted" }),
    );
  });
});
