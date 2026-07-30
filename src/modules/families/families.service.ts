import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Family } from './entities/family.entity';
import { FamilyChild } from './entities/family-child.entity';
import { Member } from '../members/entities/member.entity';
import { Minister } from '../ministers/entities/minister.entity';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { CreateFamilyChildDto } from './dto/create-family-child.dto';
import { UpdateFamilyChildDto } from './dto/update-family-child.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { LeaderType } from '../../common/leadership/leader.types';

type PersonType = LeaderType;

type SpousePerson = {
  id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  type: PersonType;
  gender?: string | null;
  marital_status?: string | null;
};

export interface FamilyStats {
  familyCount: number;
  childrenCount: number;
  childrenBelow10: number;
  childrenTeenage: number;
  childrenAbove20: number;
}

@Injectable()
export class FamiliesService {
  constructor(
    @InjectRepository(Family)
    private readonly families: Repository<Family>,
    @InjectRepository(FamilyChild)
    private readonly children: Repository<FamilyChild>,
    @InjectRepository(Member)
    private readonly members: Repository<Member>,
    @InjectRepository(Minister)
    private readonly ministers: Repository<Minister>,
  ) {}

  private normalizeGender(value?: string | null) {
    return (value || '').trim().toLowerCase();
  }

  private async resolvePerson(id: string, type: PersonType): Promise<SpousePerson | null> {
    if (type === 'minister') {
      const minister = await this.ministers.findOne({ where: { id } });
      if (!minister) return null;
      return {
        id: minister.id,
        first_name: minister.first_name,
        middle_name: minister.middle_name,
        last_name: minister.last_name,
        email: minister.email,
        phone: minister.phone,
        type: 'minister',
        gender: minister.gender,
        marital_status: minister.marital_status,
      };
    }

    const member = await this.members.findOne({ where: { id } });
    if (!member) return null;
    return {
      id: member.id,
      first_name: member.first_name,
      middle_name: member.middle_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone,
      type: 'member',
      gender: member.gender,
      marital_status: member.marital_status,
    };
  }

  private async attachSpouses(family: Family): Promise<Family> {
    const [husband, wife] = await Promise.all([
      this.resolvePerson(family.husband_id, family.husband_type),
      this.resolvePerson(family.wife_id, family.wife_type),
    ]);
    family.husband = husband;
    family.wife = wife;
    family.children = (family.children || []).sort(
      (a, b) => a.age - b.age || a.name.localeCompare(b.name),
    );
    return family;
  }

  private async ensureSpousesAvailable(
    husbandId: string,
    husbandType: PersonType,
    wifeId: string,
    wifeType: PersonType,
    excludeFamilyId?: string,
  ) {
    if (husbandId === wifeId && husbandType === wifeType) {
      throw new BadRequestException('Husband and wife must be different people');
    }

    const qb = this.families.createQueryBuilder('family').where(
      `(
        (family.husband_id = :husbandId AND family.husband_type = :husbandType)
        OR (family.wife_id = :husbandId AND family.wife_type = :husbandType)
        OR (family.husband_id = :wifeId AND family.husband_type = :wifeType)
        OR (family.wife_id = :wifeId AND family.wife_type = :wifeType)
      )`,
      { husbandId, husbandType, wifeId, wifeType },
    );

    if (excludeFamilyId) {
      qb.andWhere('family.id != :excludeFamilyId', { excludeFamilyId });
    }

    const conflict = await qb.getOne();
    if (conflict) {
      throw new BadRequestException(
        'One or both selected people already belong to another family',
      );
    }
  }

  private async markMarriedIfSingle(id: string, type: PersonType) {
    if (type === 'minister') {
      const minister = await this.ministers.findOne({ where: { id } });
      if (!minister) return;
      const status = (minister.marital_status || '').trim().toLowerCase();
      if (!status || status === 'single') {
        minister.marital_status = 'married';
        await this.ministers.save(minister);
      }
      return;
    }

    const member = await this.members.findOne({ where: { id } });
    if (!member) return;
    const status = (member.marital_status || '').trim().toLowerCase();
    if (!status || status === 'single') {
      member.marital_status = 'married';
      await this.members.save(member);
    }
  }

  private defaultFamilyName(husband?: SpousePerson | null, wife?: SpousePerson | null) {
    const last = husband?.last_name || wife?.last_name || 'Family';
    return `The ${last} Family`;
  }

  private async validateSpouseGenders(
    husband: SpousePerson,
    wife: SpousePerson,
  ) {
    if (this.normalizeGender(husband.gender) !== 'male') {
      throw new BadRequestException('Husband must be a male member or minister');
    }
    if (this.normalizeGender(wife.gender) !== 'female') {
      throw new BadRequestException('Wife must be a female member or minister');
    }
  }

  async getStats(): Promise<FamilyStats> {
    const familyCount = await this.families.count();
    const childrenCount = await this.children.count();
    const [childrenBelow10, childrenTeenage, childrenAbove20] = await Promise.all([
      this.children.createQueryBuilder('c').where('c.age < :age', { age: 10 }).getCount(),
      this.children
        .createQueryBuilder('c')
        .where('c.age >= :min AND c.age <= :max', { min: 10, max: 19 })
        .getCount(),
      this.children.createQueryBuilder('c').where('c.age >= :age', { age: 20 }).getCount(),
    ]);

    return {
      familyCount,
      childrenCount,
      childrenBelow10,
      childrenTeenage,
      childrenAbove20,
    };
  }

  async create(dto: CreateFamilyDto): Promise<Family> {
    await this.ensureSpousesAvailable(
      dto.husband_id,
      dto.husband_type,
      dto.wife_id,
      dto.wife_type,
    );

    const [husband, wife] = await Promise.all([
      this.resolvePerson(dto.husband_id, dto.husband_type),
      this.resolvePerson(dto.wife_id, dto.wife_type),
    ]);
    if (!husband || !wife) {
      throw new BadRequestException('Husband and wife must be existing people');
    }
    await this.validateSpouseGenders(husband, wife);

    const family = this.families.create({
      husband_id: dto.husband_id,
      husband_type: dto.husband_type,
      wife_id: dto.wife_id,
      wife_type: dto.wife_type,
      name: dto.name?.trim() || this.defaultFamilyName(husband, wife),
      notes: dto.notes?.trim() || null,
    });
    const saved = await this.families.save(family);
    await Promise.all([
      this.markMarriedIfSingle(dto.husband_id, dto.husband_type),
      this.markMarriedIfSingle(dto.wife_id, dto.wife_type),
    ]);
    return this.findOne(saved.id);
  }

  async findAllPaginated(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<PaginatedResult<Family>> {
    const qb = this.families
      .createQueryBuilder('family')
      .leftJoinAndSelect('family.children', 'children');

    if (search?.trim()) {
      const pattern = `%${search.trim().toLowerCase()}%`;
      qb.andWhere('LOWER(COALESCE(family.name, \'\')) LIKE :pattern', { pattern });
    }

    qb.orderBy('family.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    const withSpouses = await Promise.all(data.map((f) => this.attachSpouses(f)));

    return {
      data: withSpouses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string): Promise<Family> {
    const family = await this.families.findOne({
      where: { id },
      relations: { children: true },
    });
    if (!family) throw new NotFoundException('Family not found');
    return this.attachSpouses(family);
  }

  async findByPerson(personId: string, type: PersonType = 'member'): Promise<Family | null> {
    const family = await this.families.findOne({
      where: [
        { husband_id: personId, husband_type: type },
        { wife_id: personId, wife_type: type },
      ],
      relations: { children: true },
    });
    if (!family) return null;
    return this.attachSpouses(family);
  }

  async update(id: string, dto: UpdateFamilyDto): Promise<Family> {
    const family = await this.findOne(id);
    const nextHusbandId = dto.husband_id ?? family.husband_id;
    const nextHusbandType = dto.husband_type ?? family.husband_type;
    const nextWifeId = dto.wife_id ?? family.wife_id;
    const nextWifeType = dto.wife_type ?? family.wife_type;

    const spousesChanged =
      nextHusbandId !== family.husband_id ||
      nextHusbandType !== family.husband_type ||
      nextWifeId !== family.wife_id ||
      nextWifeType !== family.wife_type;

    if (spousesChanged) {
      await this.ensureSpousesAvailable(
        nextHusbandId,
        nextHusbandType,
        nextWifeId,
        nextWifeType,
        id,
      );
      const [husband, wife] = await Promise.all([
        this.resolvePerson(nextHusbandId, nextHusbandType),
        this.resolvePerson(nextWifeId, nextWifeType),
      ]);
      if (!husband || !wife) {
        throw new BadRequestException('Husband and wife must be existing people');
      }
      await this.validateSpouseGenders(husband, wife);
      family.husband_id = nextHusbandId;
      family.husband_type = nextHusbandType;
      family.wife_id = nextWifeId;
      family.wife_type = nextWifeType;
      await Promise.all([
        this.markMarriedIfSingle(nextHusbandId, nextHusbandType),
        this.markMarriedIfSingle(nextWifeId, nextWifeType),
      ]);
    }

    if (dto.name !== undefined) family.name = dto.name?.trim() || null;
    if (dto.notes !== undefined) family.notes = dto.notes?.trim() || null;

    await this.families.save(family);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.families.delete(id);
    if (result.affected === 0) throw new NotFoundException('Family not found');
  }

  async addChild(familyId: string, dto: CreateFamilyChildDto): Promise<FamilyChild> {
    await this.findOne(familyId);
    const child = this.children.create({
      family_id: familyId,
      name: dto.name.trim(),
      age: dto.age,
    });
    return this.children.save(child);
  }

  async updateChild(
    familyId: string,
    childId: string,
    dto: UpdateFamilyChildDto,
  ): Promise<FamilyChild> {
    const child = await this.children.findOne({
      where: { id: childId, family_id: familyId },
    });
    if (!child) throw new NotFoundException('Child not found');
    if (dto.name !== undefined) child.name = dto.name.trim();
    if (dto.age !== undefined) child.age = dto.age;
    return this.children.save(child);
  }

  async removeChild(familyId: string, childId: string): Promise<void> {
    const result = await this.children.delete({ id: childId, family_id: familyId });
    if (result.affected === 0) throw new NotFoundException('Child not found');
  }
}
