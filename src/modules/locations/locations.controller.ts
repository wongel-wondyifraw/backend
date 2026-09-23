import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequiresPermissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @RequiresPermissions('locations.read', 'locations.manage', 'members.create', 'members.update')
  @ApiOperation({ summary: 'Get all locations' })
  findAll(@Query('status') status?: string) {
    return this.locationsService.findAll(status);
  }

  @Get(':id')
  @RequiresPermissions('locations.read', 'locations.manage', 'members.create', 'members.update')
  @ApiOperation({ summary: 'Get a location by id' })
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Post()
  @RequiresPermissions('locations.manage', 'members.create')
  @ApiOperation({ summary: 'Create a new location' })
  create(@Body() dto: CreateLocationDto) {
    return this.locationsService.create(dto);
  }

  @Patch(':id')
  @RequiresPermissions('locations.manage')
  @ApiOperation({ summary: 'Update a location' })
  update(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.locationsService.update(id, dto);
  }
}
