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
import { HomeGroupsService } from "./home-groups.service";
import { CreateHomeGroupDto } from "./dto/create-home-group.dto";
import { UpdateHomeGroupDto } from "./dto/update-home-group.dto";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { RequiresPermissions } from "../../common/decorators/permissions.decorator";

@Controller("home-groups")
export class HomeGroupsController {
  constructor(private readonly homeGroupsService: HomeGroupsService) {}

  @Post()
  @RequiresPermissions("home_groups.create")
  create(@Body() dto: CreateHomeGroupDto) {
    return this.homeGroupsService.create(dto);
  }

  @Get()
  @RequiresPermissions("home_groups.read")
  findAll(@Query() query: PaginationQueryDto) {
    return this.homeGroupsService.findAllPaginated(
      query.page,
      query.limit,
      query.search,
    );
  }

  @Get(":id")
  @RequiresPermissions("home_groups.read")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.homeGroupsService.findOne(id);
  }

  @Patch(":id")
  @RequiresPermissions("home_groups.update")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateHomeGroupDto,
  ) {
    return this.homeGroupsService.update(id, dto);
  }

  @Delete(":id")
  @RequiresPermissions("home_groups.delete")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.homeGroupsService.remove(id);
  }

  @Get(":id/members")
  @RequiresPermissions("home_groups.read")
  getMembers(@Param("id", ParseUUIDPipe) id: string) {
    return this.homeGroupsService.getHomeGroupMembers(id);
  }

  @Post(":id/members/:memberId")
  @RequiresPermissions("home_groups.update")
  addMember(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("memberId", ParseUUIDPipe) memberId: string,
  ) {
    return this.homeGroupsService.addMember(id, memberId);
  }

  @Delete(":id/members/:memberId")
  @RequiresPermissions("home_groups.update")
  removeMember(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("memberId", ParseUUIDPipe) memberId: string,
  ) {
    return this.homeGroupsService.removeMember(id, memberId);
  }
}
