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
} from "@nestjs/common";
import { ContactRequestsService } from "./contact-requests.service";
import { CreateContactRequestDto } from "./dto/create-contact-request.dto";
import { UpdateContactRequestDto } from "./dto/update-contact-request.dto";
import { Public } from "../../common/decorators/public.decorator";
import { RequiresPermissions } from "../../common/decorators/permissions.decorator";

@Controller("website/contact-requests")
export class ContactRequestsController {
  constructor(
    private readonly contactRequestsService: ContactRequestsService,
  ) {}

  /**
   * Public endpoint to submit prayer requests, ministry inquiries, or general messages.
   */
  @Public()
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
  @RequiresPermissions("website.manage")
  async list(@Query("status") status?: string) {
    return this.contactRequestsService.findAll(status);
  }

  @Get(":id")
  @RequiresPermissions("website.manage")
  async getOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.contactRequestsService.findOne(id);
  }

  @Patch(":id")
  @RequiresPermissions("website.manage")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactRequestDto,
  ) {
    return this.contactRequestsService.update(id, dto);
  }

  @Delete(":id")
  @RequiresPermissions("website.manage")
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    await this.contactRequestsService.delete(id);
    return { success: true };
  }
}
