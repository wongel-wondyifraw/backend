import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  ForbiddenException,
} from "@nestjs/common";
import { MembersService } from "./members.service";
import { CreateMemberDto } from "./dto/create-member.dto";
import { BulkCreateMembersDto } from "./dto/bulk-create-members.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";
import { MemberListQueryDto } from "./dto/member-list-query.dto";
import { MinistriesService } from "../ministries/ministries.service";
import { RequiresPermissions } from "../../common/decorators/permissions.decorator";
import type { User } from "../users/entities/user.entity";

const APPROVE_ONLY_ALLOWED_FIELDS = new Set(["status", "status_reason"]);

@Controller("members")
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly ministriesService: MinistriesService,
  ) {}

  @Post("bulk")
  @RequiresPermissions("members.create")
  async createBulk(@Body() dto: BulkCreateMembersDto) {
    return this.membersService.createBulk(dto.items);
  }

  @Post()
  @RequiresPermissions("members.create")
  async create(@Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(createMemberDto);
  }

  @Get()
  @RequiresPermissions("members.read")
  async findAll(@Query() query: MemberListQueryDto) {
    return this.membersService.findAllPaginated(
      query.page,
      query.limit,
      query.search,
      {
        status: query.status,
        marital_status: query.marital_status,
        joined_from: query.joined_from,
        joined_to: query.joined_to,
        joined_calendar: query.joined_calendar,
        sort_by: query.sort_by,
        sort_order: query.sort_order,
      },
    );
  }

  @Get(":id")
  @RequiresPermissions("members.read")
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.membersService.findOne(id);
  }

  @Patch(":id")
  @RequiresPermissions("members.update", "members.approve")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateMemberDto: UpdateMemberDto,
    @Req() req: { user?: User },
  ) {
    const granted = new Set(
      (req.user?.roleEntity?.permissions ?? []).map((p) => p.slug),
    );
    if (!granted.has("members.update")) {
      const updatedKeys = Object.keys(
        updateMemberDto as Record<string, unknown>,
      ).filter(
        (key) =>
          (updateMemberDto as Record<string, unknown>)[key] !== undefined,
      );
      const hasDisallowed = updatedKeys.some(
        (key) => !APPROVE_ONLY_ALLOWED_FIELDS.has(key),
      );
      if (hasDisallowed || updatedKeys.length === 0) {
        throw new ForbiddenException("Missing permission: members.update");
      }
    }
    return this.membersService.update(id, updateMemberDto, req.user?.id);
  }

  @Delete(":id")
  @RequiresPermissions("members.delete")
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.membersService.remove(id);
  }

  @Get(":id/ministries")
  @RequiresPermissions("members.read")
  async getMemberMinistries(@Param("id", ParseUUIDPipe) id: string) {
    return this.ministriesService.getMemberMinistries(id);
  }
}
