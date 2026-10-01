import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { FamiliesService } from "./families.service";
import { CreateFamilyDto } from "./dto/create-family.dto";
import { UpdateFamilyDto } from "./dto/update-family.dto";
import { CreateFamilyChildDto } from "./dto/create-family-child.dto";
import { UpdateFamilyChildDto } from "./dto/update-family-child.dto";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { RequiresPermissions } from "../../common/decorators/permissions.decorator";

@Controller("families")
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Get("stats")
  @RequiresPermissions("families.read")
  getStats() {
    return this.familiesService.getStats();
  }

  @Get("by-member/:memberId")
  @RequiresPermissions("families.read")
  async findByMember(@Param("memberId", ParseUUIDPipe) memberId: string) {
    const family = await this.familiesService.findByPerson(memberId, "member");
    return { family };
  }

  @Get("by-person/:personId")
  @RequiresPermissions("families.read")
  async findByPerson(
    @Param("personId", ParseUUIDPipe) personId: string,
    @Query("type") type?: string,
  ) {
    const personType = type === "minister" ? "minister" : "member";
    const family = await this.familiesService.findByPerson(
      personId,
      personType,
    );
    return { family };
  }

  @Post()
  @RequiresPermissions("families.create")
  create(@Body() dto: CreateFamilyDto) {
    return this.familiesService.create(dto);
  }

  @Get()
  @RequiresPermissions("families.read")
  findAll(@Query() query: PaginationQueryDto) {
    return this.familiesService.findAllPaginated(
      query.page,
      query.limit,
      query.search,
    );
  }

  @Get(":id")
  @RequiresPermissions("families.read")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.familiesService.findOne(id);
  }

  @Patch(":id")
  @RequiresPermissions("families.update")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateFamilyDto) {
    return this.familiesService.update(id, dto);
  }

  @Delete(":id")
  @RequiresPermissions("families.delete")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.familiesService.remove(id);
  }

  @Post(":id/children")
  @RequiresPermissions("families.update")
  addChild(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateFamilyChildDto,
  ) {
    return this.familiesService.addChild(id, dto);
  }

  @Patch(":id/children/:childId")
  @RequiresPermissions("families.update")
  updateChild(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("childId", ParseUUIDPipe) childId: string,
    @Body() dto: UpdateFamilyChildDto,
  ) {
    return this.familiesService.updateChild(id, childId, dto);
  }

  @Delete(":id/children/:childId")
  @RequiresPermissions("families.update")
  removeChild(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("childId", ParseUUIDPipe) childId: string,
  ) {
    return this.familiesService.removeChild(id, childId);
  }
}
