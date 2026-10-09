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
  Request,
} from "@nestjs/common";
import { MinistersService } from "./ministers.service";
import { CreateMinisterDto } from "./dto/create-minister.dto";
import { UpdateMinisterDto } from "./dto/update-minister.dto";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { RequiresPermissions } from "../../common/decorators/permissions.decorator";

@Controller("ministers")
export class MinistersController {
  constructor(private readonly ministersService: MinistersService) {}

  @Post()
  @RequiresPermissions("ministers.create")
  create(
    @Request() req: { user: { id: string; role: string } },
    @Body() dto: CreateMinisterDto,
  ) {
    return this.ministersService.create(dto, req.user);
  }

  @Get()
  @RequiresPermissions("ministers.read")
  findAll(@Query() query: PaginationQueryDto) {
    return this.ministersService.findAllPaginated(
      query.page,
      query.limit,
      query.search,
    );
  }

  @Get(":id")
  @RequiresPermissions("ministers.read")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.ministersService.findOne(id);
  }

  @Patch(":id")
  @RequiresPermissions("ministers.update")
  update(
    @Request() req: { user: { id: string; role: string } },
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateMinisterDto,
  ) {
    return this.ministersService.update(id, dto, req.user);
  }

  @Post(":id/reset-password")
  @RequiresPermissions("ministers.update")
  resetPassword(@Param("id", ParseUUIDPipe) id: string) {
    return this.ministersService.resetPassword(id);
  }

  @Delete(":id")
  @RequiresPermissions("ministers.delete")
  remove(
    @Request() req: { user: { id: string; role: string } },
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.ministersService.remove(id, req.user);
  }
}
