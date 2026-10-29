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
var DashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const member_entity_1 = require("../members/entities/member.entity");
const ministry_entity_1 = require("../ministries/entities/ministry.entity");
const minister_entity_1 = require("../ministers/entities/minister.entity");
const user_entity_1 = require("../users/entities/user.entity");
const MONTH_LABELS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];
let DashboardService = DashboardService_1 = class DashboardService {
    constructor(membersRepository, ministriesRepository, ministersRepository, usersRepository) {
        this.membersRepository = membersRepository;
        this.ministriesRepository = ministriesRepository;
        this.ministersRepository = ministersRepository;
        this.usersRepository = usersRepository;
        this.statsCache = null;
    }
    startOfMonthUtc() {
        const now = new Date();
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    }
    daysAgoUtc(days) {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - days);
        d.setUTCHours(0, 0, 0, 0);
        return d;
    }
    async getStats() {
        if (this.statsCache && this.statsCache.expiresAt > Date.now()) {
            return this.statsCache.value;
        }
        const monthStart = this.startOfMonthUtc();
        const weekStart = this.daysAgoUtc(7);
        const twoWeeksStart = this.daysAgoUtc(14);
        const year = new Date().getUTCFullYear();
        const [memberCount, activeMembers, membersThisMonth, membersThisWeek, membersLastWeek, ministerCount, activeMinisters, ministersThisMonth, ministryCount, ministriesWithLeader, ministryShareRaw, registrationsRaw, sparkRaw,] = await Promise.all([
            this.membersRepository.count(),
            this.membersRepository
                .createQueryBuilder("member")
                .where("LOWER(COALESCE(member.status, 'active')) = 'active'")
                .getCount(),
            this.membersRepository
                .createQueryBuilder("member")
                .where("member.created_at >= :monthStart", { monthStart })
                .getCount(),
            this.membersRepository
                .createQueryBuilder("member")
                .where("member.created_at >= :weekStart", { weekStart })
                .getCount(),
            this.membersRepository
                .createQueryBuilder("member")
                .where("member.created_at >= :twoWeeksStart AND member.created_at < :weekStart", {
                twoWeeksStart,
                weekStart,
            })
                .getCount(),
            this.ministersRepository.count(),
            this.ministersRepository
                .createQueryBuilder("minister")
                .where("LOWER(COALESCE(minister.status, 'active')) = 'active'")
                .getCount(),
            this.ministersRepository
                .createQueryBuilder("minister")
                .where("minister.created_at >= :monthStart", { monthStart })
                .getCount(),
            this.ministriesRepository.count(),
            this.ministriesRepository
                .createQueryBuilder("ministry")
                .where("ministry.leader_id IS NOT NULL")
                .getCount(),
            this.ministriesRepository
                .createQueryBuilder("ministry")
                .leftJoin("ministry.ministry_members", "mm")
                .select("ministry.name", "name")
                .addSelect("COUNT(mm.member_id)", "value")
                .groupBy("ministry.id")
                .addGroupBy("ministry.name")
                .orderBy("value", "DESC")
                .addOrderBy("ministry.name", "ASC")
                .getRawMany(),
            this.membersRepository
                .createQueryBuilder("member")
                .select("EXTRACT(MONTH FROM member.created_at)", "month")
                .addSelect("COUNT(*)", "count")
                .where("EXTRACT(YEAR FROM member.created_at) = :year", { year })
                .groupBy("month")
                .getRawMany(),
            this.membersRepository
                .createQueryBuilder("member")
                .select(`DATE_TRUNC('month', member.created_at)`, "bucket")
                .addSelect("COUNT(*)", "count")
                .where("member.created_at >= :from", {
                from: new Date(Date.UTC(year - 1, new Date().getUTCMonth(), 1)),
            })
                .groupBy("bucket")
                .orderBy("bucket", "ASC")
                .getRawMany(),
        ]);
        const monthBuckets = MONTH_LABELS.map((month) => ({ month, value: 0 }));
        for (const row of registrationsRaw) {
            const idx = Math.max(0, Math.min(11, Number(row.month) - 1));
            if (!Number.isNaN(idx))
                monthBuckets[idx].value = Number(row.count) || 0;
        }
        const sparkMap = new Map();
        for (const row of sparkRaw) {
            const d = new Date(row.bucket);
            const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
            sparkMap.set(key, Number(row.count) || 0);
        }
        const registrationSpark = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
            const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
            registrationSpark.push(sparkMap.get(key) || 0);
        }
        const value = {
            memberCount,
            activeMembers,
            inactiveMembers: Math.max(0, memberCount - activeMembers),
            membersThisMonth,
            membersThisWeek,
            membersLastWeek,
            ministerCount,
            activeMinisters,
            inactiveMinisters: Math.max(0, ministerCount - activeMinisters),
            ministersThisMonth,
            ministryCount,
            ministriesWithLeader,
            ministriesWithoutLeader: Math.max(0, ministryCount - ministriesWithLeader),
            ministryShare: ministryShareRaw.map((row) => ({
                name: row.name || "Untitled",
                value: Number(row.value) || 0,
            })),
            registrationsByMonth: monthBuckets,
            registrationSpark,
        };
        this.statsCache = {
            value,
            expiresAt: Date.now() + DashboardService_1.STATS_TTL_MS,
        };
        return value;
    }
    async search(query, includeUsers) {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            return [];
        }
        const pattern = `%${trimmed.toLowerCase()}%`;
        const results = [];
        const members = await this.membersRepository
            .createQueryBuilder("member")
            .where("LOWER(member.first_name) LIKE :pattern OR LOWER(member.last_name) LIKE :pattern OR LOWER(member.email) LIKE :pattern OR member.phone LIKE :pattern", { pattern })
            .orderBy("member.created_at", "DESC")
            .take(8)
            .getMany();
        for (const member of members) {
            const fullName = [member.first_name, member.middle_name, member.last_name]
                .filter(Boolean)
                .join(" ");
            results.push({
                id: member.id,
                label: fullName,
                sublabel: member.email || member.phone || "Member",
                category: "Members",
                path: `/members/details/${member.id}`,
            });
        }
        const ministries = await this.ministriesRepository
            .createQueryBuilder("ministry")
            .where("LOWER(ministry.name) LIKE :pattern", { pattern })
            .orderBy("ministry.created_at", "DESC")
            .take(8)
            .getMany();
        for (const ministry of ministries) {
            results.push({
                id: ministry.id,
                label: ministry.name,
                sublabel: "Ministry",
                category: "Ministries",
                path: `/ministries/details/${ministry.id}`,
            });
        }
        if (includeUsers) {
            const users = await this.usersRepository
                .createQueryBuilder("user")
                .where("LOWER(user.first_name) LIKE :pattern OR LOWER(user.last_name) LIKE :pattern OR LOWER(user.email) LIKE :pattern", { pattern })
                .orderBy("user.created_at", "DESC")
                .take(8)
                .getMany();
            for (const user of users) {
                const fullName = [user.first_name, user.middle_name, user.last_name]
                    .filter(Boolean)
                    .join(" ");
                results.push({
                    id: user.id,
                    label: fullName,
                    sublabel: `${user.email} · ${user.role}`,
                    category: "Users",
                    path: "/settings",
                });
            }
        }
        return results.slice(0, 15);
    }
};
exports.DashboardService = DashboardService;
DashboardService.STATS_TTL_MS = 60000;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
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
