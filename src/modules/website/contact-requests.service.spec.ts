import { NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Repository, SelectQueryBuilder } from "typeorm";
import { ContactRequestsService } from "./contact-requests.service";
import { ContactRequest } from "./entities/contact-request.entity";
import { NOTIFICATION_EVENT } from "../notifications/notification-events";

describe("ContactRequestsService", () => {
  let service: ContactRequestsService;
  let repository: jest.Mocked<
    Pick<
      Repository<ContactRequest>,
      "create" | "save" | "findOne" | "remove" | "createQueryBuilder"
    >
  >;
  let events: jest.Mocked<Pick<EventEmitter2, "emit">>;

  const mockRequest = {
    id: "req-1",
    full_name: "Yohannes Bekele",
    phone: "+251911223344",
    email: "yohannes@example.com",
    category: "prayer" as const,
    message: "Please pray for my mother's health and recovery.",
    is_confidential: false,
    status: "new" as const,
    assigned_to: null,
    notes: null,
    responded_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  } as unknown as ContactRequest;

  const mockConfidentialRequest = {
    ...mockRequest,
    id: "req-2",
    is_confidential: true,
    message: "Strictly confidential prayer request.",
  } as unknown as ContactRequest;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    events = { emit: jest.fn() };

    service = new ContactRequestsService(
      repository as unknown as Repository<ContactRequest>,
      events as unknown as EventEmitter2,
    );
  });

  describe("create", () => {
    it("creates a request and emits a notification event pointing to dashboard tab", async () => {
      repository.create.mockReturnValue(mockRequest);
      repository.save.mockResolvedValue(mockRequest);

      const result = await service.create({
        full_name: "Yohannes Bekele",
        phone: "+251911223344",
        email: "yohannes@example.com",
        category: "prayer",
        message: "Please pray for my mother's health and recovery.",
        is_confidential: false,
      });

      expect(result).toEqual(mockRequest);
      expect(repository.save).toHaveBeenCalled();
      expect(events.emit).toHaveBeenCalledWith(
        NOTIFICATION_EVENT,
        expect.objectContaining({
          eventName: "contact_request.created",
          href: "/dashboard?tab=requests",
          targetRoles: ["admin", "minister"],
        }),
      );
    });

    it("emits confidential notifications restricted to admin role", async () => {
      repository.create.mockReturnValue(mockConfidentialRequest);
      repository.save.mockResolvedValue(mockConfidentialRequest);

      await service.create({
        full_name: "Yohannes Bekele",
        phone: "+251911223344",
        category: "prayer",
        message: "Strictly confidential prayer request.",
        is_confidential: true,
      });

      expect(events.emit).toHaveBeenCalledWith(
        NOTIFICATION_EVENT,
        expect.objectContaining({
          eventName: "contact_request.created",
          href: "/dashboard?tab=requests",
          title: "Confidential Prayer Request",
          targetRoles: ["admin"],
        }),
      );
    });
  });

  describe("findAll", () => {
    it("excludes confidential requests for non-admin users", async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockRequest]),
      } as unknown as SelectQueryBuilder<ContactRequest>;

      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(undefined, false);

      expect(qb.andWhere).toHaveBeenCalledWith("cr.is_confidential = false");
      expect(result).toEqual([mockRequest]);
    });

    it("includes confidential requests for admin users", async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockRequest, mockConfidentialRequest]),
      } as unknown as SelectQueryBuilder<ContactRequest>;

      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(undefined, true);

      expect(qb.andWhere).not.toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it("applies status filter when provided", async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockRequest]),
      } as unknown as SelectQueryBuilder<ContactRequest>;

      repository.createQueryBuilder.mockReturnValue(qb);

      await service.findAll("new", true);

      expect(qb.where).toHaveBeenCalledWith("cr.status = :status", { status: "new" });
    });
  });

  describe("findOne", () => {
    it("returns non-confidential request to any authorized user", async () => {
      repository.findOne.mockResolvedValue(mockRequest);

      const result = await service.findOne("req-1", false);
      expect(result).toEqual(mockRequest);
    });

    it("throws NotFoundException if non-admin tries to access confidential request", async () => {
      repository.findOne.mockResolvedValue(mockConfidentialRequest);

      await expect(service.findOne("req-2", false)).rejects.toThrow(NotFoundException);
    });

    it("returns confidential request to admin", async () => {
      repository.findOne.mockResolvedValue(mockConfidentialRequest);

      const result = await service.findOne("req-2", true);
      expect(result).toEqual(mockConfidentialRequest);
    });
  });

  describe("update", () => {
    it("updates status to responded and records timestamp and notes", async () => {
      repository.findOne.mockResolvedValue({ ...mockRequest } as unknown as ContactRequest);
      repository.save.mockImplementation(async (item) => item as ContactRequest);

      const updated = await service.update(
        "req-1",
        {
          status: "responded",
          notes: "Called and prayed with brother Yohannes",
          responded_at: "2026-10-29T10:00:00.000Z",
        },
        true,
      );

      expect(updated.status).toBe("responded");
      expect(updated.notes).toBe("Called and prayed with brother Yohannes");
      expect(updated.responded_at).toEqual(new Date("2026-10-29T10:00:00.000Z"));
    });
  });

  describe("delete", () => {
    it("removes request if found", async () => {
      repository.findOne.mockResolvedValue(mockRequest);
      repository.remove.mockResolvedValue(mockRequest);

      await service.delete("req-1");
      expect(repository.remove).toHaveBeenCalledWith(mockRequest);
    });
  });
});
