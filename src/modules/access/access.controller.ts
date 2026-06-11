import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { RequiresPermissions } from '../../common/decorators/permissions.decorator';
import { AccessService } from './access.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('access')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Get('roles')
  @RequiresPermissions('roles.read')
  listRoles() {
    return this.accessService.listRoles();
  }

  @Get('roles/:id')
  @RequiresPermissions('roles.read')
  getRole(@Param('id', ParseUUIDPipe) id: string) {
    return this.accessService.findRole(id);
  }

  @Post('roles')
  @RequiresPermissions('roles.manage')
  @HttpCode(HttpStatus.CREATED)
  createRole(@Body() dto: CreateRoleDto) {
    return this.accessService.createRole(dto);
  }

  @Patch('roles/:id')
  @RequiresPermissions('roles.manage')
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.accessService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @RequiresPermissions('roles.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(@Param('id', ParseUUIDPipe) id: string) {
    await this.accessService.removeRole(id);
  }

  @Get('permissions')
  @RequiresPermissions('roles.read')
  listPermissions() {
    return this.accessService.listPermissions();
  }

  @Get('permissions/grouped')
  @RequiresPermissions('roles.read')
  listPermissionsGrouped() {
    return this.accessService.listPermissionsGrouped();
  }
}
