import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Member } from "../members/entities/member.entity";
import { Ministry } from "../ministries/entities/ministry.entity";
import { Minister } from "../ministers/entities/minister.entity";
import { User } from "../users/entities/user.entity";

export interface MinistryShareItem {
  name: string;
  value: number;
}

export interface MonthCount {
  month: string;
  value: number;
}

export interface DashboardStats {
  memberCount: number;
  activeMembers: number;
  inactiveMembers: number;
  membersThisMonth: number;
  membersThisWeek: number;
  membersLastWeek: number;
  ministerCount: number;
  activeMinisters: number;
  inactiveMinisters: number;
  ministersThisMonth: number;
  ministryCount: number;
  ministriesWithLeader: number;
  ministriesWithoutLeader: number;
  ministryShare: MinistryShareItem[];
  registrationsByMonth: MonthCount[];
  registrationSpark: number[];
}

export interface SearchResultItem {
  id: string;
  label: string;
  sublabel: string;
  category: "Members" | "Ministries" | "Users";
  path: string;
}

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

  private daysAgoUtc(days: number): Date {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  async getStats(): Promise<DashboardStats> {
    const monthStart = this.startOfMonthUtc();
    const weekStart = this.daysAgoUtc(7);
    const twoWeeksStart = this.daysAgoUtc(14);
    const year = new Date().getUTCFullYear();

    const [
      memberCount,
      activeMembers,
      membersThisMonth,
      membersThisWeek,
      membersLastWeek,
      ministerCount,
      activeMinisters,
      ministersThisMonth,
      ministryCount,
      ministriesWithLeader,
      ministryShareRaw,
      registrationsRaw,
      sparkRaw,
    ] = await Promise.all([
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
        .where(
          "member.created_at >= :twoWeeksStart AND member.created_at < :weekStart",
          {
            twoWeeksStart,
            weekStart,
          },
        )
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
        .addSelect("COUNT(mm.id)", "value")
        .groupBy("ministry.id")
        .addGroupBy("ministry.name")
        .orderBy("value", "DESC")
        .addOrderBy("ministry.name", "ASC")
        .getRawMany<{ name: string; value: string }>(),
      this.membersRepository
        .createQueryBuilder("member")
        .select("EXTRACT(MONTH FROM member.created_at)", "month")
        .addSelect("COUNT(*)", "count")
        .where("EXTRACT(YEAR FROM member.created_at) = :year", { year })
        .groupBy("month")
        .getRawMany<{ month: string; count: string }>(),
      this.membersRepository
        .createQueryBuilder("member")
        .select(`DATE_TRUNC('month', member.created_at)`, "bucket")
        .addSelect("COUNT(*)", "count")
        .where("member.created_at >= :from", {
          from: new Date(Date.UTC(year - 1, new Date().getUTCMonth(), 1)),
        })
        .groupBy("bucket")
        .orderBy("bucket", "ASC")
        .getRawMany<{ bucket: Date; count: string }>(),
    ]);

    const monthBuckets = MONTH_LABELS.map((month) => ({ month, value: 0 }));
    for (const row of registrationsRaw) {
      const idx = Math.max(0, Math.min(11, Number(row.month) - 1));
      if (!Number.isNaN(idx)) monthBuckets[idx].value = Number(row.count) || 0;
    }

    const sparkMap = new Map<string, number>();
    for (const row of sparkRaw) {
      const d = new Date(row.bucket);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
      sparkMap.set(key, Number(row.count) || 0);
    }
    const registrationSpark: number[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
      );
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
      registrationSpark.push(sparkMap.get(key) || 0);
    }

    return {
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
      ministriesWithoutLeader: Math.max(
        0,
        ministryCount - ministriesWithLeader,
      ),
      ministryShare: ministryShareRaw.map((row) => ({
        name: row.name || "Untitled",
        value: Number(row.value) || 0,
      })),
      registrationsByMonth: monthBuckets,
      registrationSpark,
    };
  }

  async search(
    query: string,
    includeUsers: boolean,
  ): Promise<SearchResultItem[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return [];
    }

    const pattern = `%${trimmed.toLowerCase()}%`;
    const results: SearchResultItem[] = [];

    const members = await this.membersRepository
      .createQueryBuilder("member")
      .where(
        "LOWER(member.first_name) LIKE :pattern OR LOWER(member.last_name) LIKE :pattern OR LOWER(member.email) LIKE :pattern OR member.phone LIKE :pattern",
        { pattern },
      )
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
        .where(
          "LOWER(user.first_name) LIKE :pattern OR LOWER(user.last_name) LIKE :pattern OR LOWER(user.email) LIKE :pattern",
          { pattern },
        )
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
}
