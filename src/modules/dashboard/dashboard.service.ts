import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../members/entities/member.entity';
import { Ministry } from '../ministries/entities/ministry.entity';
import { Minister } from '../ministers/entities/minister.entity';
import { User } from '../users/entities/user.entity';

export interface DashboardStats {
    memberCount: number;
    activeMembers: number;
    inactiveMembers: number;
    membersThisMonth: number;
    ministerCount: number;
    activeMinisters: number;
    inactiveMinisters: number;
    ministersThisMonth: number;
    ministryCount: number;
    ministriesWithLeader: number;
    ministriesWithoutLeader: number;
}

export interface SearchResultItem {
    id: string;
    label: string;
    sublabel: string;
    category: 'Members' | 'Ministries' | 'Users';
    path: string;
}

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Member)
        private readonly membersRepository: Repository<Member>,
        @InjectRepository(Ministry)
        private readonly ministriesRepository: Repository<Ministry>,
        @InjectRepository(Minister)
        private readonly ministersRepository: Repository<Minister>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    private startOfMonthUtc(): Date {
        const now = new Date();
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    }

    async getStats(): Promise<DashboardStats> {
        const monthStart = this.startOfMonthUtc();

        const [
            memberCount,
            activeMembers,
            membersThisMonth,
            ministerCount,
            activeMinisters,
            ministersThisMonth,
            ministryCount,
            ministriesWithLeader,
        ] = await Promise.all([
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

    async search(query: string, includeUsers: boolean): Promise<SearchResultItem[]> {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            return [];
        }

        const pattern = `%${trimmed.toLowerCase()}%`;
        const results: SearchResultItem[] = [];

        const members = await this.membersRepository
            .createQueryBuilder('member')
            .where(
                'LOWER(member.first_name) LIKE :pattern OR LOWER(member.last_name) LIKE :pattern OR LOWER(member.email) LIKE :pattern OR member.phone LIKE :pattern',
                { pattern },
            )
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
                .where(
                    'LOWER(user.first_name) LIKE :pattern OR LOWER(user.last_name) LIKE :pattern OR LOWER(user.email) LIKE :pattern',
                    { pattern },
                )
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
}
