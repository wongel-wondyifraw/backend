import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  Req,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ContactRequestsService } from "./contact-requests.service";
import { CreateContactRequestDto } from "./dto/create-contact-request.dto";
import { UpdateContactRequestDto } from "./dto/update-contact-request.dto";
import { Public } from "../../common/decorators/public.decorator";
import { RequiresPermissions } from "../../common/decorators/permissions.decorator";
import type { User } from "../users/entities/user.entity";

@Controller("website/contact-requests")
export class ContactRequestsController {
  constructor(
    private readonly contactRequestsService: ContactRequestsService,
  ) {}

  private isUserAdmin(user?: User): boolean {
    return user?.roleEntity?.key === "admin" || user?.role === "admin";
  }

  /**
   * Public endpoint to submit prayer requests, ministry inquiries, or general messages.
   */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  async submit(@Body() dto: CreateContactRequestDto) {
    const created = await this.contactRequestsService.create(dto);
    return {
      success: true,
      message: "Thank you for reaching out. Your request has been received.",
      id: created.id,
    };
  }

  /**
   * Pastoral staff endpoint to view incoming requests.
   */
  @Get()
  @RequiresPermissions("website.manage", "dashboard.read")
  async list(
    @Req() req: { user?: User },
    @Query("status") status?: string,
  ) {
    const isAdmin = this.isUserAdmin(req.user);
    return this.contactRequestsService.findAll(status, isAdmin);
  }

  @Get(":id")
  @RequiresPermissions("website.manage", "dashboard.read")
  async getOne(
    @Req() req: { user?: User },
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    const isAdmin = this.isUserAdmin(req.user);
    return this.contactRequestsService.findOne(id, isAdmin);
  }

  @Patch(":id")
  @RequiresPermissions("website.manage", "dashboard.read")
  async update(
    @Req() req: { user?: User },
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactRequestDto,
  ) {
    const isAdmin = this.isUserAdmin(req.user);
    return this.contactRequestsService.update(id, dto, isAdmin);
  }

  @Delete(":id")
  @RequiresPermissions("website.manage")
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    await this.contactRequestsService.delete(id);
    return { success: true };
  }
}
