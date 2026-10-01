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
exports.FamiliesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const family_entity_1 = require("./entities/family.entity");
const family_child_entity_1 = require("./entities/family-child.entity");
const member_entity_1 = require("../members/entities/member.entity");
const minister_entity_1 = require("../ministers/entities/minister.entity");
let FamiliesService = class FamiliesService {
    constructor(families, children, members, ministers, dataSource) {
        this.families = families;
        this.children = children;
        this.members = members;
        this.ministers = ministers;
        this.dataSource = dataSource;
    }
    normalizeGender(value) {
        return (value || "").trim().toLowerCase();
    }
    async resolvePerson(id, type) {
        if (!id)
            return null;
        if (type === "minister") {
            const minister = await this.ministers.findOne({ where: { id } });
            if (!minister)
                return null;
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
        if (!member)
            return null;
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
    async attachSpouses(family) {
        const [husband, wife] = await Promise.all([
            this.resolvePerson(family.husband_id, family.husband_type),
            this.resolvePerson(family.wife_id, family.wife_type),
        ]);
        family.husband = husband;
        family.wife = wife;
        family.children = (family.children || []).sort((a, b) => (a.age || 0) - (b.age || 0) || a.name.localeCompare(b.name));
        return family;
    }
    /** Batch-load spouses for a page of families (avoids N+1). */
    async attachSpousesBatch(families) {
        if (families.length === 0)
            return families;
        const memberIds = new Set();
        const ministerIds = new Set();
        for (const f of families) {
            if (f.husband_id) {
                if (f.husband_type === "minister")
                    ministerIds.add(f.husband_id);
                else
                    memberIds.add(f.husband_id);
            }
            if (f.wife_id) {
                if (f.wife_type === "minister")
                    ministerIds.add(f.wife_id);
                else
                    memberIds.add(f.wife_id);
            }
        }
        const members = memberIds.size > 0
            ? await this.members
                .createQueryBuilder("m")
                .where("m.id IN (:...ids)", { ids: [...memberIds] })
                .getMany()
            : [];
        const ministers = ministerIds.size > 0
            ? await this.ministers
                .createQueryBuilder("m")
                .where("m.id IN (:...ids)", { ids: [...ministerIds] })
                .getMany()
            : [];
        const memberMap = new Map(members.map((m) => [m.id, m]));
        const ministerMap = new Map(ministers.map((m) => [m.id, m]));
        const toSpouse = (id, type) => {
            if (!id)
                return null;
            if (type === "minister") {
                const minister = ministerMap.get(id);
                if (!minister)
                    return null;
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
            if (!member)
                return null;
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
            family.children = (family.children || []).sort((a, b) => (a.age || 0) - (b.age || 0) || a.name.localeCompare(b.name));
        }
        return families;
    }
    async ensureSpousesAvailable(husbandId, husbandType, wifeId, wifeType, excludeFamilyId) {
        if (!husbandId && !wifeId)
            return;
        if (husbandId &&
            wifeId &&
            husbandId === wifeId &&
            husbandType === wifeType) {
            throw new common_1.BadRequestException("Husband and wife must be different people");
        }
        const qb = this.families.createQueryBuilder("family").where("1=0"); // Start with false
        if (husbandId) {
            qb.orWhere(`(family.husband_id = :husbandId AND family.husband_type = :husbandType)`, { husbandId, husbandType });
            qb.orWhere(`(family.wife_id = :husbandId AND family.wife_type = :husbandType)`, { husbandId, husbandType });
        }
        if (wifeId) {
            qb.orWhere(`(family.husband_id = :wifeId AND family.husband_type = :wifeType)`, { wifeId, wifeType });
            qb.orWhere(`(family.wife_id = :wifeId AND family.wife_type = :wifeType)`, { wifeId, wifeType });
        }
        if (excludeFamilyId) {
            qb.andWhere("family.id != :excludeFamilyId", { excludeFamilyId });
        }
        const conflict = await qb.getOne();
        if (conflict) {
            throw new common_1.BadRequestException("One or both selected people already belong to another family");
        }
    }
    async markMarriedIfSingle(id, type, manager) {
        if (!id)
            return;
        if (type === "minister") {
            const ministerRepo = manager
                ? manager.getRepository(minister_entity_1.Minister)
                : this.ministers;
            const minister = await ministerRepo.findOne({ where: { id } });
            if (!minister)
                return;
            const status = (minister.marital_status || "").trim().toLowerCase();
            if (!status || status === "single") {
                minister.marital_status = "married";
                await ministerRepo.save(minister);
            }
            return;
        }
        const memberRepo = manager ? manager.getRepository(member_entity_1.Member) : this.members;
        const member = await memberRepo.findOne({ where: { id } });
        if (!member)
            return;
        const status = (member.marital_status || "").trim().toLowerCase();
        if (!status || status === "single") {
            member.marital_status = "married";
            await memberRepo.save(member);
        }
    }
    defaultFamilyName(husband, wife) {
        const last = (husband === null || husband === void 0 ? void 0 : husband.last_name) || (wife === null || wife === void 0 ? void 0 : wife.last_name) || "Family";
        return `The ${last} Family`;
    }
    async validateSpouseGenders(husband, wife) {
        if (husband && this.normalizeGender(husband.gender) !== "male") {
            throw new common_1.BadRequestException("Husband must be a male member or minister");
        }
        if (wife && this.normalizeGender(wife.gender) !== "female") {
            throw new common_1.BadRequestException("Wife must be a female member or minister");
        }
    }
    async getStats() {
        const familyCount = await this.families.count();
        const childrenCount = await this.children.count();
        const [childrenBelow10, childrenTeenage, childrenAbove20] = await Promise.all([
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
    async create(dto) {
        var _a, _b, _c, _d, _e, _f;
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
                throw new common_1.BadRequestException("At least one parent or spouse must be provided");
            }
            if (hasHusband || hasWife) {
                await this.ensureSpousesAvailable(dto.husband_id, dto.husband_type, dto.wife_id, dto.wife_type);
            }
            const [husband, wife] = await Promise.all([
                this.resolvePerson(dto.husband_id, dto.husband_type),
                this.resolvePerson(dto.wife_id, dto.wife_type),
            ]);
            if (hasHusband && !husband) {
                throw new common_1.BadRequestException("Husband must be an existing person");
            }
            if (hasWife && !wife) {
                throw new common_1.BadRequestException("Wife must be an existing person");
            }
            if (spouseStatus === "registered" && hasHusband && hasWife) {
                await this.validateSpouseGenders(husband, wife);
            }
            else {
                await this.validateSpouseGenders(husband, wife);
            }
            if (spouseStatus === "external" &&
                !((_a = dto.external_spouse_name) === null || _a === void 0 ? void 0 : _a.trim()) &&
                !hasHusband &&
                !hasWife) {
                throw new common_1.BadRequestException("External spouse name is required");
            }
            const family = this.families.create({
                husband_id: dto.husband_id || null,
                husband_type: dto.husband_type || "member",
                wife_id: dto.wife_id || null,
                wife_type: dto.wife_type || "member",
                spouse_status: spouseStatus,
                external_spouse_name: ((_b = dto.external_spouse_name) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                external_spouse_phone: ((_c = dto.external_spouse_phone) === null || _c === void 0 ? void 0 : _c.trim()) || null,
                external_spouse_church: ((_d = dto.external_spouse_church) === null || _d === void 0 ? void 0 : _d.trim()) || null,
                name: ((_e = dto.name) === null || _e === void 0 ? void 0 : _e.trim()) || this.defaultFamilyName(husband, wife),
                notes: ((_f = dto.notes) === null || _f === void 0 ? void 0 : _f.trim()) || null,
            });
            const saved = await queryRunner.manager.save(family_entity_1.Family, family);
            if (spouseStatus === "registered") {
                await Promise.all([
                    this.markMarriedIfSingle(dto.husband_id, dto.husband_type, queryRunner.manager),
                    this.markMarriedIfSingle(dto.wife_id, dto.wife_type, queryRunner.manager),
                ]);
            }
            await queryRunner.commitTransaction();
            return this.findOne(saved.id);
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async findAllPaginated(page = 1, limit = 20, search) {
        const qb = this.families
            .createQueryBuilder("family")
            .leftJoinAndSelect("family.children", "children");
        if (search === null || search === void 0 ? void 0 : search.trim()) {
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
    async findOne(id) {
        const family = await this.families.findOne({
            where: { id },
            relations: { children: true },
        });
        if (!family)
            throw new common_1.NotFoundException("Family not found");
        return this.attachSpouses(family);
    }
    async findByPerson(personId, type = "member") {
        const family = await this.families.findOne({
            where: [
                { husband_id: personId, husband_type: type },
                { wife_id: personId, wife_type: type },
            ],
            relations: { children: true },
        });
        if (!family)
            return null;
        return this.attachSpouses(family);
    }
    async update(id, dto) {
        var _a, _b, _c, _d, _e, _f, _g;
        const family = await this.findOne(id);
        const nextHusbandId = dto.husband_id !== undefined ? dto.husband_id : family.husband_id;
        const nextHusbandType = (_a = dto.husband_type) !== null && _a !== void 0 ? _a : family.husband_type;
        const nextWifeId = dto.wife_id !== undefined ? dto.wife_id : family.wife_id;
        const nextWifeType = (_b = dto.wife_type) !== null && _b !== void 0 ? _b : family.wife_type;
        const nextStatus = dto.spouse_status !== undefined
            ? dto.spouse_status.trim().toLowerCase()
            : family.spouse_status;
        const spousesChanged = nextHusbandId !== family.husband_id ||
            nextHusbandType !== family.husband_type ||
            nextWifeId !== family.wife_id ||
            nextWifeType !== family.wife_type;
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            if (!nextHusbandId && !nextWifeId && nextStatus !== "external") {
                throw new common_1.BadRequestException("At least one parent or spouse must be provided");
            }
            if (spousesChanged) {
                await this.ensureSpousesAvailable(nextHusbandId, nextHusbandType, nextWifeId, nextWifeType, id);
                const [husband, wife] = await Promise.all([
                    this.resolvePerson(nextHusbandId, nextHusbandType),
                    this.resolvePerson(nextWifeId, nextWifeType),
                ]);
                if (nextHusbandId && !husband) {
                    throw new common_1.BadRequestException("Husband must be an existing person");
                }
                if (nextWifeId && !wife) {
                    throw new common_1.BadRequestException("Wife must be an existing person");
                }
                await this.validateSpouseGenders(husband, wife);
                family.husband_id = nextHusbandId || null;
                family.husband_type = nextHusbandType || "member";
                family.wife_id = nextWifeId || null;
                family.wife_type = nextWifeType || "member";
                if (nextStatus === "registered") {
                    await Promise.all([
                        this.markMarriedIfSingle(nextHusbandId, nextHusbandType, queryRunner.manager),
                        this.markMarriedIfSingle(nextWifeId, nextWifeType, queryRunner.manager),
                    ]);
                }
            }
            if (dto.spouse_status !== undefined)
                family.spouse_status = nextStatus;
            if (dto.external_spouse_name !== undefined) {
                family.external_spouse_name = ((_c = dto.external_spouse_name) === null || _c === void 0 ? void 0 : _c.trim()) || null;
            }
            if (dto.external_spouse_phone !== undefined) {
                family.external_spouse_phone =
                    ((_d = dto.external_spouse_phone) === null || _d === void 0 ? void 0 : _d.trim()) || null;
            }
            if (dto.external_spouse_church !== undefined) {
                family.external_spouse_church =
                    ((_e = dto.external_spouse_church) === null || _e === void 0 ? void 0 : _e.trim()) || null;
            }
            if (dto.name !== undefined)
                family.name = ((_f = dto.name) === null || _f === void 0 ? void 0 : _f.trim()) || null;
            if (dto.notes !== undefined)
                family.notes = ((_g = dto.notes) === null || _g === void 0 ? void 0 : _g.trim()) || null;
            await queryRunner.manager.save(family_entity_1.Family, family);
            await queryRunner.commitTransaction();
            return this.findOne(id);
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async remove(id) {
        const result = await this.families.delete(id);
        if (result.affected === 0)
            throw new common_1.NotFoundException("Family not found");
    }
    async addChild(familyId, dto) {
        var _a;
        await this.findOne(familyId);
        let age = (_a = dto.age) !== null && _a !== void 0 ? _a : null;
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
    async updateChild(familyId, childId, dto) {
        const child = await this.children.findOne({
            where: { id: childId, family_id: familyId },
        });
        if (!child)
            throw new common_1.NotFoundException("Child not found");
        if (dto.name !== undefined)
            child.name = dto.name.trim();
        if (dto.age !== undefined)
            child.age = dto.age;
        if (dto.date_of_birth !== undefined) {
            child.date_of_birth = dto.date_of_birth
                ? new Date(dto.date_of_birth)
                : null;
        }
        return this.children.save(child);
    }
    async removeChild(familyId, childId) {
        const result = await this.children.delete({
            id: childId,
            family_id: familyId,
        });
        if (result.affected === 0)
            throw new common_1.NotFoundException("Child not found");
    }
};
exports.FamiliesService = FamiliesService;
exports.FamiliesService = FamiliesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(family_entity_1.Family)),
    __param(1, (0, typeorm_1.InjectRepository)(family_child_entity_1.FamilyChild)),
    __param(2, (0, typeorm_1.InjectRepository)(member_entity_1.Member)),
    __param(3, (0, typeorm_1.InjectRepository)(minister_entity_1.Minister)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], FamiliesService);
