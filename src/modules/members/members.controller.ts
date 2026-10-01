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
} from "@nestjs/common";
import { MembersService } from "./members.service";
import { CreateMemberDto } from "./dto/create-member.dto";
import { BulkCreateMembersDto } from "./dto/bulk-create-members.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";
import { MemberListQueryDto } from "./dto/member-list-query.dto";
import { MinistriesService } from "../ministries/ministries.service";
import { RequiresPermissions } from "../../common/decorators/permissions.decorator";

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
  @RequiresPermissions("members.update")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    return this.membersService.update(id, updateMemberDto);
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
