import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MinistersService } from './ministers.service';
import { CreateMinisterDto } from './dto/create-minister.dto';
import { UpdateMinisterDto } from './dto/update-minister.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ministers')
@UseGuards(JwtAuthGuard)
export class MinistersController {
    constructor(private readonly ministersService: MinistersService) { }

    @Post()
    create(@Body() createMinisterDto: CreateMinisterDto) {
        return this.ministersService.create(createMinisterDto);
    }

    @Get()
    findAll() {
        return this.ministersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.ministersService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateMinisterDto: UpdateMinisterDto) {
        return this.ministersService.update(id, updateMinisterDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.ministersService.remove(id);
    }
}
