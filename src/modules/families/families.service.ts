import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, EntityManager } from "typeorm";
import { Family } from "./entities/family.entity";
import { FamilyChild } from "./entities/family-child.entity";
import { Member } from "../members/entities/member.entity";
import { Minister } from "../ministers/entities/minister.entity";
import { CreateFamilyDto } from "./dto/create-family.dto";
import { UpdateFamilyDto } from "./dto/update-family.dto";
import { CreateFamilyChildDto } from "./dto/create-family-child.dto";
import { UpdateFamilyChildDto } from "./dto/update-family-child.dto";
import { PaginatedResult } from "../../common/interfaces/paginated-result.interface";
import { LeaderType } from "../../common/leadership/leader.types";

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
    private readonly dataSource: DataSource,
  ) {}

  private normalizeGender(value?: string | null) {
    return (value || "").trim().toLowerCase();
  }

  private async resolvePerson(
    id: string | null | undefined,
    type?: PersonType | null,
  ): Promise<SpousePerson | null> {
    if (!id) return null;
    if (type === "minister") {
      const minister = await this.ministers.findOne({ where: { id } });
      if (!minister) return null;
      return {
        id: minister.id,
        first_name: minister.first_name,
        middle_name: minister.middle_name,
        last_name: minister.last_name,
        email: minister.email,
        phone: minister.phone,
        type: "minister",
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
      type: "member",
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
      (a, b) => (a.age || 0) - (b.age || 0) || a.name.localeCompare(b.name),
    );
    return family;
  }

  /** Batch-load spouses for a page of families (avoids N+1). */
  private async attachSpousesBatch(families: Family[]): Promise<Family[]> {
    if (families.length === 0) return families;

    const memberIds = new Set<string>();
    const ministerIds = new Set<string>();
    for (const f of families) {
      if (f.husband_id) {
        if (f.husband_type === "minister") ministerIds.add(f.husband_id);
        else memberIds.add(f.husband_id);
      }
      if (f.wife_id) {
        if (f.wife_type === "minister") ministerIds.add(f.wife_id);
        else memberIds.add(f.wife_id);
      }
    }

    const members =
      memberIds.size > 0
        ? await this.members
            .createQueryBuilder("m")
            .where("m.id IN (:...ids)", { ids: [...memberIds] })
            .getMany()
        : [];
    const ministers =
      ministerIds.size > 0
        ? await this.ministers
            .createQueryBuilder("m")
            .where("m.id IN (:...ids)", { ids: [...ministerIds] })
            .getMany()
        : [];

    const memberMap = new Map(members.map((m) => [m.id, m]));
    const ministerMap = new Map(ministers.map((m) => [m.id, m]));

    const toSpouse = (
      id: string | null | undefined,
      type?: PersonType | null,
    ): SpousePerson | null => {
      if (!id) return null;
      if (type === "minister") {
        const minister = ministerMap.get(id);
        if (!minister) return null;
        return {
          id: minister.id,
          first_name: minister.first_name,
          middle_name: minister.middle_name,
          last_name: minister.last_name,
          email: minister.email,
          phone: minister.phone,
          type: "minister",
          gender: minister.gender,
          marital_status: minister.marital_status,
        };
      }
      const member = memberMap.get(id);
      if (!member) return null;
      return {
        id: member.id,
        first_name: member.first_name,
        middle_name: member.middle_name,
        last_name: member.last_name,
        email: member.email,
        phone: member.phone,
        type: "member",
        gender: member.gender,
        marital_status: member.marital_status,
      };
    };

    for (const family of families) {
      family.husband = toSpouse(family.husband_id, family.husband_type);
      family.wife = toSpouse(family.wife_id, family.wife_type);
      family.children = (family.children || []).sort(
        (a, b) => (a.age || 0) - (b.age || 0) || a.name.localeCompare(b.name),
      );
    }
    return families;
  }

  private async ensureSpousesAvailable(
    husbandId?: string | null,
    husbandType?: PersonType | null,
    wifeId?: string | null,
    wifeType?: PersonType | null,
    excludeFamilyId?: string,
  ) {
    if (!husbandId && !wifeId) return;

    if (
      husbandId &&
      wifeId &&
      husbandId === wifeId &&
      husbandType === wifeType
    ) {
      throw new BadRequestException(
        "Husband and wife must be different people",
      );
    }

    const qb = this.families.createQueryBuilder("family").where("1=0"); // Start with false

    if (husbandId) {
      qb.orWhere(
        `(family.husband_id = :husbandId AND family.husband_type = :husbandType)`,
        { husbandId, husbandType },
      );
      qb.orWhere(
        `(family.wife_id = :husbandId AND family.wife_type = :husbandType)`,
        { husbandId, husbandType },
      );
    }

    if (wifeId) {
      qb.orWhere(
        `(family.husband_id = :wifeId AND family.husband_type = :wifeType)`,
        { wifeId, wifeType },
      );
      qb.orWhere(
        `(family.wife_id = :wifeId AND family.wife_type = :wifeType)`,
        { wifeId, wifeType },
      );
    }

    if (excludeFamilyId) {
      qb.andWhere("family.id != :excludeFamilyId", { excludeFamilyId });
    }

    const potentialConflicts = await qb.getMany();
    for (const fam of potentialConflicts) {
      const isRegisteredCouple =
        fam.spouse_status === "registered" &&
        Boolean(fam.husband_id) &&
        Boolean(fam.wife_id);
      const isExternalMarriage =
        fam.spouse_status === "external" &&
        Boolean(fam.external_spouse_name?.trim());

      if (isRegisteredCouple || isExternalMarriage) {
        throw new BadRequestException(
          "One or both selected people already belong to an active family with a spouse",
        );
      }
    }
  }

  private async mergePlaceholderFamily(
    targetFamilyId: string,
    personId: string | null | undefined,
    personType: PersonType | null | undefined,
    manager: EntityManager,
  ) {
    if (!personId) return;

    const placeholder = await manager
      .getRepository(Family)
      .createQueryBuilder("family")
      .leftJoinAndSelect("family.children", "children")
      .where("family.id != :targetFamilyId", { targetFamilyId })
      .andWhere(
        `((family.husband_id = :pId AND family.husband_type = :pType) OR (family.wife_id = :pId AND family.wife_type = :pType))`,
        { pId: personId, pType: personType || "member" },
      )
      .getOne();

    if (!placeholder) return;

    // Do not merge if placeholder has an active registered spouse or external spouse
    const hasHusband = Boolean(placeholder.husband_id);
    const hasWife = Boolean(placeholder.wife_id);
    const isRegisteredCouple =
      placeholder.spouse_status === "registered" && hasHusband && hasWife;
    const isExternal =
      placeholder.spouse_status === "external" &&
      Boolean(placeholder.external_spouse_name?.trim());

    if (isRegisteredCouple || isExternal) return;

    // Load target family's existing children
    const targetChildren = await manager.getRepository(FamilyChild).find({
      where: { family_id: targetFamilyId },
    });

    const normalize = (s?: string | null) => (s || "").trim().toLowerCase();

    for (const sourceChild of placeholder.children || []) {
      const isDuplicate = targetChildren.some((tc) => {
        const sameName = normalize(tc.name) === normalize(sourceChild.name);
        const sameDob =
          tc.date_of_birth && sourceChild.date_of_birth
            ? new Date(tc.date_of_birth).getTime() ===
              new Date(sourceChild.date_of_birth).getTime()
            : false;
        const sameAge =
          tc.age !== null &&
          tc.age !== undefined &&
          sourceChild.age !== null &&
          sourceChild.age !== undefined
            ? tc.age === sourceChild.age
            : false;
        return sameName && (sameDob || sameAge);
      });

      if (!isDuplicate) {
        // Transfer child to target family directly via update query to avoid relation cascades
        await manager
          .getRepository(FamilyChild)
          .update(sourceChild.id, { family_id: targetFamilyId });
      } else {
        // Delete duplicate child record from placeholder
        await manager.getRepository(FamilyChild).delete(sourceChild.id);
      }
    }

    // Delete the placeholder family
    await manager.getRepository(Family).delete(placeholder.id);
  }

  private async markMarriedIfSingle(
    id: string | null | undefined,
    type?: PersonType | null,
    manager?: EntityManager,
  ) {
    if (!id) return;
    if (type === "minister") {
      const ministerRepo = manager
        ? manager.getRepository(Minister)
        : this.ministers;
      const minister = await ministerRepo.findOne({ where: { id } });
      if (!minister) return;
      const status = (minister.marital_status || "").trim().toLowerCase();
      if (!status || status === "single") {
        minister.marital_status = "married";
        await ministerRepo.save(minister);
      }
      return;
    }

    const memberRepo = manager ? manager.getRepository(Member) : this.members;
    const member = await memberRepo.findOne({ where: { id } });
    if (!member) return;
    const status = (member.marital_status || "").trim().toLowerCase();
    if (!status || status === "single") {
      member.marital_status = "married";
      await memberRepo.save(member);
    }
  }

  private defaultFamilyName(
    husband?: SpousePerson | null,
    wife?: SpousePerson | null,
  ) {
    const last = husband?.last_name || wife?.last_name || "Family";
    return `The ${last} Family`;
  }

  private async validateSpouseGenders(
    husband: SpousePerson | null,
    wife: SpousePerson | null,
  ) {
    if (husband && this.normalizeGender(husband.gender) !== "male") {
      throw new BadRequestException(
        "Husband must be a male member or minister",
      );
    }
    if (wife && this.normalizeGender(wife.gender) !== "female") {
      throw new BadRequestException("Wife must be a female member or minister");
    }
  }

  async getStats(): Promise<FamilyStats> {
    const familyCount = await this.families.count();
    const childrenCount = await this.children.count();
    const [childrenBelow10, childrenTeenage, childrenAbove20] =
      await Promise.all([
        this.children
          .createQueryBuilder("c")
          .where("c.age < :age", { age: 10 })
          .getCount(),
        this.children
          .createQueryBuilder("c")
          .where("c.age >= :min AND c.age <= :max", { min: 10, max: 19 })
          .getCount(),
        this.children
          .createQueryBuilder("c")
          .where("c.age >= :age", { age: 20 })
          .getCount(),
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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const spouseStatus = (dto.spouse_status || "registered")
        .trim()
        .toLowerCase();
      const hasHusband = Boolean(dto.husband_id);
      const hasWife = Boolean(dto.wife_id);

      if (!hasHusband && !hasWife && spouseStatus !== "external") {
        throw new BadRequestException(
          "At least one parent or spouse must be provided",
        );
      }

      if (hasHusband || hasWife) {
        await this.ensureSpousesAvailable(
          dto.husband_id,
          dto.husband_type,
          dto.wife_id,
          dto.wife_type,
        );
      }

      const [husband, wife] = await Promise.all([
        this.resolvePerson(dto.husband_id, dto.husband_type),
        this.resolvePerson(dto.wife_id, dto.wife_type),
      ]);

      if (hasHusband && !husband) {
        throw new BadRequestException("Husband must be an existing person");
      }
      if (hasWife && !wife) {
        throw new BadRequestException("Wife must be an existing person");
      }

      if (spouseStatus === "registered" && hasHusband && hasWife) {
        await this.validateSpouseGenders(husband, wife);
      } else {
        await this.validateSpouseGenders(husband, wife);
      }

      if (
        spouseStatus === "external" &&
        !dto.external_spouse_name?.trim() &&
        !hasHusband &&
        !hasWife
      ) {
        throw new BadRequestException("External spouse name is required");
      }

      const family = this.families.create({
        husband_id: dto.husband_id || null,
        husband_type: dto.husband_type || "member",
        wife_id: dto.wife_id || null,
        wife_type: dto.wife_type || "member",
        spouse_status: spouseStatus,
        external_spouse_name: dto.external_spouse_name?.trim() || null,
        external_spouse_phone: dto.external_spouse_phone?.trim() || null,
        external_spouse_church: dto.external_spouse_church?.trim() || null,
        name: dto.name?.trim() || this.defaultFamilyName(husband, wife),
        notes: dto.notes?.trim() || null,
      });
      const saved = await queryRunner.manager.save(Family, family);

      if (dto.husband_id) {
        await this.mergePlaceholderFamily(
          saved.id,
          dto.husband_id,
          dto.husband_type,
          queryRunner.manager,
        );
      }
      if (dto.wife_id) {
        await this.mergePlaceholderFamily(
          saved.id,
          dto.wife_id,
          dto.wife_type,
          queryRunner.manager,
        );
      }

      if (spouseStatus === "registered") {
        await Promise.all([
          this.markMarriedIfSingle(
            dto.husband_id,
            dto.husband_type,
            queryRunner.manager,
          ),
          this.markMarriedIfSingle(
            dto.wife_id,
            dto.wife_type,
            queryRunner.manager,
          ),
        ]);
      }

      await queryRunner.commitTransaction();
      return this.findOne(saved.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllPaginated(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<PaginatedResult<Family>> {
    const qb = this.families
      .createQueryBuilder("family")
      .leftJoinAndSelect("family.children", "children");

    if (search?.trim()) {
      const pattern = `%${search.trim().toLowerCase()}%`;
      qb.andWhere("LOWER(COALESCE(family.name, '')) LIKE :pattern", {
        pattern,
      });
    }

    qb.orderBy("family.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    const withSpouses = await this.attachSpousesBatch(data);

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
    if (!family) throw new NotFoundException("Family not found");
    return this.attachSpouses(family);
  }

  async findByPerson(
    personId: string,
    type: PersonType = "member",
  ): Promise<Family | null> {
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
    const nextHusbandId =
      dto.husband_id !== undefined ? dto.husband_id : family.husband_id;
    const nextHusbandType = dto.husband_type ?? family.husband_type;
    const nextWifeId = dto.wife_id !== undefined ? dto.wife_id : family.wife_id;
    const nextWifeType = dto.wife_type ?? family.wife_type;
    const nextStatus =
      dto.spouse_status !== undefined
        ? dto.spouse_status.trim().toLowerCase()
        : family.spouse_status;

    const spousesChanged =
      nextHusbandId !== family.husband_id ||
      nextHusbandType !== family.husband_type ||
      nextWifeId !== family.wife_id ||
      nextWifeType !== family.wife_type;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!nextHusbandId && !nextWifeId && nextStatus !== "external") {
        throw new BadRequestException(
          "At least one parent or spouse must be provided",
        );
      }

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
        if (nextHusbandId && !husband) {
          throw new BadRequestException("Husband must be an existing person");
        }
        if (nextWifeId && !wife) {
          throw new BadRequestException("Wife must be an existing person");
        }
        await this.validateSpouseGenders(husband, wife);
        family.husband_id = nextHusbandId || null;
        family.husband_type = nextHusbandType || "member";
        family.wife_id = nextWifeId || null;
        family.wife_type = nextWifeType || "member";

        if (nextHusbandId) {
          await this.mergePlaceholderFamily(
            family.id,
            nextHusbandId,
            nextHusbandType,
            queryRunner.manager,
          );
        }
        if (nextWifeId) {
          await this.mergePlaceholderFamily(
            family.id,
            nextWifeId,
            nextWifeType,
            queryRunner.manager,
          );
        }

        if (nextStatus === "registered") {
          await Promise.all([
            this.markMarriedIfSingle(
              nextHusbandId,
              nextHusbandType,
              queryRunner.manager,
            ),
            this.markMarriedIfSingle(
              nextWifeId,
              nextWifeType,
              queryRunner.manager,
            ),
          ]);
        }
      }

      if (dto.spouse_status !== undefined) family.spouse_status = nextStatus;
      if (dto.external_spouse_name !== undefined) {
        family.external_spouse_name = dto.external_spouse_name?.trim() || null;
      }
      if (dto.external_spouse_phone !== undefined) {
        family.external_spouse_phone =
          dto.external_spouse_phone?.trim() || null;
      }
      if (dto.external_spouse_church !== undefined) {
        family.external_spouse_church =
          dto.external_spouse_church?.trim() || null;
      }
      if (dto.name !== undefined) family.name = dto.name?.trim() || null;
      if (dto.notes !== undefined) family.notes = dto.notes?.trim() || null;

      delete (family as unknown as Record<string, unknown>).children;
      delete (family as unknown as Record<string, unknown>).husband;
      delete (family as unknown as Record<string, unknown>).wife;

      await queryRunner.manager.save(Family, family);
      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.families.delete(id);
    if (result.affected === 0) throw new NotFoundException("Family not found");
  }

  async addChild(
    familyId: string,
    dto: CreateFamilyChildDto,
  ): Promise<FamilyChild> {
    await this.findOne(familyId);
    let age = dto.age ?? null;
    if (dto.date_of_birth && (age === null || age === undefined)) {
      const dob = new Date(dto.date_of_birth);
      if (!Number.isNaN(dob.getTime())) {
        const now = new Date();
        age = Math.max(0, now.getFullYear() - dob.getFullYear());
      }
    }
    const child = this.children.create({
      family_id: familyId,
      name: dto.name.trim(),
      age,
      date_of_birth: dto.date_of_birth ? new Date(dto.date_of_birth) : null,
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
    if (!child) throw new NotFoundException("Child not found");
    if (dto.name !== undefined) child.name = dto.name.trim();
    if (dto.age !== undefined) child.age = dto.age;
    if (dto.date_of_birth !== undefined) {
      child.date_of_birth = dto.date_of_birth
        ? new Date(dto.date_of_birth)
        : null;
    }
    return this.children.save(child);
  }

  async removeChild(familyId: string, childId: string): Promise<void> {
    const result = await this.children.delete({
      id: childId,
      family_id: familyId,
    });
    if (result.affected === 0) throw new NotFoundException("Child not found");
  }
}
