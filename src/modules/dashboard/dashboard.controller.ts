import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get('stats')
    getStats() {
        return this.dashboardService.getStats();
    }

    @Get('search')
    search(@Query('q') query: string, @Req() req: { user: User }) {
        const includeUsers = req.user?.role === 'admin';
        return this.dashboardService.search(query || '', includeUsers);
    }
}
