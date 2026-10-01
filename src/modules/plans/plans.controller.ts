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
import { PlansService } from "./plans.service";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";
import { PlanListQueryDto } from "./dto/plan-list-query.dto";
import { RequiresPermissions } from "../../common/decorators/permissions.decorator";

@Controller("plans")
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @RequiresPermissions("plans.create")
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Get()
  @RequiresPermissions("plans.read")
  findAll(@Query() query: PlanListQueryDto) {
    return this.plansService.findAllPaginated(
      query.page,
      query.limit,
      query.search,
      {
        type: query.type,
        from: query.from,
        to: query.to,
        status: query.status,
      },
    );
  }

  @Get(":id")
  @RequiresPermissions("plans.read")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.plansService.findOne(id);
  }

  @Patch(":id")
  @RequiresPermissions("plans.update")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  @Delete(":id")
  @RequiresPermissions("plans.delete")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.plansService.remove(id);
  }
}
