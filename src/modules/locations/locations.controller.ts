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
  @ApiOperation({ summary: 'Get all locations' })
  // Any authenticated user can read locations for registration form, 
  // or we can restrict it if needed. Leaving it open to any auth user for now.
  findAll(@Query('status') status?: string) {
    return this.locationsService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a location by id' })
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new location' })
  // Creating a location on the fly during registration is needed.
  // We allow members.create or locations.manage users to do this.
  // Alternatively, just letting auth users do it if they can access the form.
  // To be safe, we'll allow any auth user, but frontend checks locations.manage for the settings tab.
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
