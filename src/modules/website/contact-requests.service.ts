import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ContactRequest } from "./entities/contact-request.entity";
import { CreateContactRequestDto } from "./dto/create-contact-request.dto";
import { UpdateContactRequestDto } from "./dto/update-contact-request.dto";
import {
  NOTIFICATION_EVENT,
  NotificationDomainEvent,
} from "../notifications/notification-events";

@Injectable()
export class ContactRequestsService {
  private readonly logger = new Logger(ContactRequestsService.name);

  constructor(
    @InjectRepository(ContactRequest)
    private readonly contactRepo: Repository<ContactRequest>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateContactRequestDto): Promise<ContactRequest> {
    const record = this.contactRepo.create({
      full_name: dto.full_name.trim(),
      phone: dto.phone.trim(),
      email: dto.email ? dto.email.trim().toLowerCase() : null,
      category: dto.category || "general",
      message: dto.message.trim(),
      is_confidential: Boolean(dto.is_confidential),
      status: "new",
    });

    const saved = await this.contactRepo.save(record);

    try {
      const isConfidential = saved.is_confidential;
      const snippet =
        saved.message.length > 80
          ? `${saved.message.slice(0, 80)}...`
          : saved.message;

      const title = isConfidential
        ? "Confidential Prayer Request"
        : `New Inquiry (${saved.category.toUpperCase()})`;

      const eventPayload: NotificationDomainEvent = {
        eventName: "contact_request.created",
        kind: "system",
        severity: isConfidential ? "warning" : "info",
        title,
        message: `${saved.full_name} (${saved.phone}): "${snippet}"`,
        href: "/dashboard?tab=requests",
        targetRoles: isConfidential ? ["admin"] : ["admin", "minister"],
        includeAdmins: true,
        payload: {
          requestId: saved.id,
          category: saved.category,
          isConfidential,
        },
      };

      this.eventEmitter.emit(NOTIFICATION_EVENT, eventPayload);
    } catch (err) {
      this.logger.warn(
        `Failed to emit notification event for contact request: ${String(err)}`,
      );
    }

    return saved;
  }

  async findAll(status?: string, isAdmin = false): Promise<ContactRequest[]> {
    const query = this.contactRepo.createQueryBuilder("cr");
    if (status) {
      query.where("cr.status = :status", { status });
    }
    if (!isAdmin) {
      query.andWhere("cr.is_confidential = false");
    }
    query.orderBy("cr.created_at", "DESC");
    return query.getMany();
  }

  async findOne(id: string, isAdmin = false): Promise<ContactRequest> {
    const found = await this.contactRepo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException(`Contact request with id ${id} not found`);
    }
    if (found.is_confidential && !isAdmin) {
      throw new NotFoundException(`Contact request with id ${id} not found`);
    }
    return found;
  }

  async update(
    id: string,
    dto: UpdateContactRequestDto,
    isAdmin = false,
  ): Promise<ContactRequest> {
    const existing = await this.findOne(id, isAdmin);

    if (dto.status !== undefined) existing.status = dto.status;
    if (dto.assigned_to !== undefined) existing.assigned_to = dto.assigned_to;
    if (dto.notes !== undefined) existing.notes = dto.notes;
    if (dto.responded_at !== undefined) {
      existing.responded_at = dto.responded_at
        ? new Date(dto.responded_at)
        : null;
    }

    return this.contactRepo.save(existing);
  }

  async delete(id: string): Promise<void> {
    const found = await this.contactRepo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException(`Contact request with id ${id} not found`);
    }
    await this.contactRepo.remove(found);
  }
}
