import { Controller, Get, Query, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { User } from '../users/entities/user.entity';
import { RequiresPermissions } from '../../common/decorators/permissions.decorator';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get('stats')
    @RequiresPermissions('dashboard.read')
    getStats() {
        return this.dashboardService.getStats();
    }

    @Get('search')
    @RequiresPermissions('dashboard.read')
    search(@Query('q') query: string, @Req() req: { user: User }) {
        const perms = new Set(
            (req.user?.roleEntity?.permissions ?? []).map((p) => p.slug),
        );
        const includeUsers = perms.has('users.read');
        return this.dashboardService.search(query || '', includeUsers);
    }
}
