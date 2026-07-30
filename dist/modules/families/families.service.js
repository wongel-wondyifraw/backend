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
    constructor(families, children, members, ministers) {
        this.families = families;
        this.children = children;
        this.members = members;
        this.ministers = ministers;
    }
    normalizeGender(value) {
        return (value || '').trim().toLowerCase();
    }
    async resolvePerson(id, type) {
        if (type === 'minister') {
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
                type: 'minister',
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
            type: 'member',
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
        family.children = (family.children || []).sort((a, b) => a.age - b.age || a.name.localeCompare(b.name));
        return family;
    }
    async ensureSpousesAvailable(husbandId, husbandType, wifeId, wifeType, excludeFamilyId) {
        if (husbandId === wifeId && husbandType === wifeType) {
            throw new common_1.BadRequestException('Husband and wife must be different people');
        }
        const qb = this.families.createQueryBuilder('family').where(`(
        (family.husband_id = :husbandId AND family.husband_type = :husbandType)
        OR (family.wife_id = :husbandId AND family.wife_type = :husbandType)
        OR (family.husband_id = :wifeId AND family.husband_type = :wifeType)
        OR (family.wife_id = :wifeId AND family.wife_type = :wifeType)
      )`, { husbandId, husbandType, wifeId, wifeType });
        if (excludeFamilyId) {
            qb.andWhere('family.id != :excludeFamilyId', { excludeFamilyId });
        }
        const conflict = await qb.getOne();
        if (conflict) {
            throw new common_1.BadRequestException('One or both selected people already belong to another family');
        }
    }
    async markMarriedIfSingle(id, type) {
        if (type === 'minister') {
            const minister = await this.ministers.findOne({ where: { id } });
            if (!minister)
                return;
            const status = (minister.marital_status || '').trim().toLowerCase();
            if (!status || status === 'single') {
                minister.marital_status = 'married';
                await this.ministers.save(minister);
            }
            return;
        }
        const member = await this.members.findOne({ where: { id } });
        if (!member)
            return;
        const status = (member.marital_status || '').trim().toLowerCase();
        if (!status || status === 'single') {
            member.marital_status = 'married';
            await this.members.save(member);
        }
    }
    defaultFamilyName(husband, wife) {
        const last = (husband === null || husband === void 0 ? void 0 : husband.last_name) || (wife === null || wife === void 0 ? void 0 : wife.last_name) || 'Family';
        return `The ${last} Family`;
    }
    async validateSpouseGenders(husband, wife) {
        if (this.normalizeGender(husband.gender) !== 'male') {
            throw new common_1.BadRequestException('Husband must be a male member or minister');
        }
        if (this.normalizeGender(wife.gender) !== 'female') {
            throw new common_1.BadRequestException('Wife must be a female member or minister');
        }
    }
    async getStats() {
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
    async create(dto) {
        var _a, _b;
        await this.ensureSpousesAvailable(dto.husband_id, dto.husband_type, dto.wife_id, dto.wife_type);
        const [husband, wife] = await Promise.all([
            this.resolvePerson(dto.husband_id, dto.husband_type),
            this.resolvePerson(dto.wife_id, dto.wife_type),
        ]);
        if (!husband || !wife) {
            throw new common_1.BadRequestException('Husband and wife must be existing people');
        }
        await this.validateSpouseGenders(husband, wife);
        const family = this.families.create({
            husband_id: dto.husband_id,
            husband_type: dto.husband_type,
            wife_id: dto.wife_id,
            wife_type: dto.wife_type,
            name: ((_a = dto.name) === null || _a === void 0 ? void 0 : _a.trim()) || this.defaultFamilyName(husband, wife),
            notes: ((_b = dto.notes) === null || _b === void 0 ? void 0 : _b.trim()) || null,
        });
        const saved = await this.families.save(family);
        await Promise.all([
            this.markMarriedIfSingle(dto.husband_id, dto.husband_type),
            this.markMarriedIfSingle(dto.wife_id, dto.wife_type),
        ]);
        return this.findOne(saved.id);
    }
    async findAllPaginated(page = 1, limit = 20, search) {
        const qb = this.families
            .createQueryBuilder('family')
            .leftJoinAndSelect('family.children', 'children');
        if (search === null || search === void 0 ? void 0 : search.trim()) {
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
    async findOne(id) {
        const family = await this.families.findOne({
            where: { id },
            relations: { children: true },
        });
        if (!family)
            throw new common_1.NotFoundException('Family not found');
        return this.attachSpouses(family);
    }
    async findByPerson(personId, type = 'member') {
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
        var _a, _b, _c, _d, _e, _f;
        const family = await this.findOne(id);
        const nextHusbandId = (_a = dto.husband_id) !== null && _a !== void 0 ? _a : family.husband_id;
        const nextHusbandType = (_b = dto.husband_type) !== null && _b !== void 0 ? _b : family.husband_type;
        const nextWifeId = (_c = dto.wife_id) !== null && _c !== void 0 ? _c : family.wife_id;
        const nextWifeType = (_d = dto.wife_type) !== null && _d !== void 0 ? _d : family.wife_type;
        const spousesChanged = nextHusbandId !== family.husband_id ||
            nextHusbandType !== family.husband_type ||
            nextWifeId !== family.wife_id ||
            nextWifeType !== family.wife_type;
        if (spousesChanged) {
            await this.ensureSpousesAvailable(nextHusbandId, nextHusbandType, nextWifeId, nextWifeType, id);
            const [husband, wife] = await Promise.all([
                this.resolvePerson(nextHusbandId, nextHusbandType),
                this.resolvePerson(nextWifeId, nextWifeType),
            ]);
            if (!husband || !wife) {
                throw new common_1.BadRequestException('Husband and wife must be existing people');
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
        if (dto.name !== undefined)
            family.name = ((_e = dto.name) === null || _e === void 0 ? void 0 : _e.trim()) || null;
        if (dto.notes !== undefined)
            family.notes = ((_f = dto.notes) === null || _f === void 0 ? void 0 : _f.trim()) || null;
        await this.families.save(family);
        return this.findOne(id);
    }
    async remove(id) {
        const result = await this.families.delete(id);
        if (result.affected === 0)
            throw new common_1.NotFoundException('Family not found');
    }
    async addChild(familyId, dto) {
        await this.findOne(familyId);
        const child = this.children.create({
            family_id: familyId,
            name: dto.name.trim(),
            age: dto.age,
        });
        return this.children.save(child);
    }
    async updateChild(familyId, childId, dto) {
        const child = await this.children.findOne({
            where: { id: childId, family_id: familyId },
        });
        if (!child)
            throw new common_1.NotFoundException('Child not found');
        if (dto.name !== undefined)
            child.name = dto.name.trim();
        if (dto.age !== undefined)
            child.age = dto.age;
        return this.children.save(child);
    }
    async removeChild(familyId, childId) {
        const result = await this.children.delete({ id: childId, family_id: familyId });
        if (result.affected === 0)
            throw new common_1.NotFoundException('Child not found');
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
        typeorm_2.Repository])
], FamiliesService);
