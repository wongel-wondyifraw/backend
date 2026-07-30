"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const member_entity_1 = require("../members/entities/member.entity");
const ministry_entity_1 = require("../ministries/entities/ministry.entity");
const minister_entity_1 = require("../ministers/entities/minister.entity");
const user_entity_1 = require("../users/entities/user.entity");
let DashboardService = class DashboardService {
    constructor(membersRepository, ministriesRepository, ministersRepository, usersRepository) {
        this.membersRepository = membersRepository;
        this.ministriesRepository = ministriesRepository;
        this.ministersRepository = ministersRepository;
        this.usersRepository = usersRepository;
    }
    startOfMonthUtc() {
        const now = new Date();
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    }
    async getStats() {
        const monthStart = this.startOfMonthUtc();
        const [memberCount, activeMembers, membersThisMonth, ministerCount, activeMinisters, ministersThisMonth, ministryCount, ministriesWithLeader,] = await Promise.all([
            this.membersRepository.count(),
            this.membersRepository
                .createQueryBuilder('member')
                .where("LOWER(COALESCE(member.status, 'active')) = 'active'")
                .getCount(),
            this.membersRepository
                .createQueryBuilder('member')
                .where('member.created_at >= :monthStart', { monthStart })
                .getCount(),
            this.ministersRepository.count(),
            this.ministersRepository
                .createQueryBuilder('minister')
                .where("LOWER(COALESCE(minister.status, 'active')) = 'active'")
                .getCount(),
            this.ministersRepository
                .createQueryBuilder('minister')
                .where('minister.created_at >= :monthStart', { monthStart })
                .getCount(),
            this.ministriesRepository.count(),
            this.ministriesRepository
                .createQueryBuilder('ministry')
                .where('ministry.leader_id IS NOT NULL')
                .getCount(),
        ]);
        return {
            memberCount,
            activeMembers,
            inactiveMembers: Math.max(0, memberCount - activeMembers),
            membersThisMonth,
            ministerCount,
            activeMinisters,
            inactiveMinisters: Math.max(0, ministerCount - activeMinisters),
            ministersThisMonth,
            ministryCount,
            ministriesWithLeader,
            ministriesWithoutLeader: Math.max(0, ministryCount - ministriesWithLeader),
        };
    }
    async search(query, includeUsers) {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            return [];
        }
        const pattern = `%${trimmed.toLowerCase()}%`;
        const results = [];
        const members = await this.membersRepository
            .createQueryBuilder('member')
            .where('LOWER(member.first_name) LIKE :pattern OR LOWER(member.last_name) LIKE :pattern OR LOWER(member.email) LIKE :pattern OR member.phone LIKE :pattern', { pattern })
            .orderBy('member.created_at', 'DESC')
            .take(8)
            .getMany();
        for (const member of members) {
            const fullName = [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(' ');
            results.push({
                id: member.id,
                label: fullName,
                sublabel: member.email || member.phone || 'Member',
                category: 'Members',
                path: `/members/details/${member.id}`,
            });
        }
        const ministries = await this.ministriesRepository
            .createQueryBuilder('ministry')
            .where('LOWER(ministry.name) LIKE :pattern', { pattern })
            .orderBy('ministry.created_at', 'DESC')
            .take(8)
            .getMany();
        for (const ministry of ministries) {
            results.push({
                id: ministry.id,
                label: ministry.name,
                sublabel: 'Ministry',
                category: 'Ministries',
                path: `/ministries/details/${ministry.id}`,
            });
        }
        if (includeUsers) {
            const users = await this.usersRepository
                .createQueryBuilder('user')
                .where('LOWER(user.first_name) LIKE :pattern OR LOWER(user.last_name) LIKE :pattern OR LOWER(user.email) LIKE :pattern', { pattern })
                .orderBy('user.created_at', 'DESC')
                .take(8)
                .getMany();
            for (const user of users) {
                const fullName = [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ');
                results.push({
                    id: user.id,
                    label: fullName,
                    sublabel: `${user.email} · ${user.role}`,
                    category: 'Users',
                    path: '/settings',
                });
            }
        }
        return results.slice(0, 15);
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(member_entity_1.Member)),
    __param(1, (0, typeorm_1.InjectRepository)(ministry_entity_1.Ministry)),
    __param(2, (0, typeorm_1.InjectRepository)(minister_entity_1.Minister)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
