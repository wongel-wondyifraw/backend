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
exports.LeaderResolverService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const member_entity_1 = require("../../modules/members/entities/member.entity");
const minister_entity_1 = require("../../modules/ministers/entities/minister.entity");
let LeaderResolverService = class LeaderResolverService {
    constructor(membersRepository, ministersRepository) {
        this.membersRepository = membersRepository;
        this.ministersRepository = ministersRepository;
    }
    async resolve(leaderId, leaderType) {
        if (!leaderId)
            return null;
        if (leaderType === 'minister') {
            return this.fromMinister(await this.ministersRepository.findOne({ where: { id: leaderId } }));
        }
        if (leaderType === 'member') {
            return this.fromMember(await this.membersRepository.findOne({ where: { id: leaderId } }));
        }
        // Legacy rows without leader_type: try member, then minister
        const member = await this.membersRepository.findOne({ where: { id: leaderId } });
        if (member)
            return this.fromMember(member);
        return this.fromMinister(await this.ministersRepository.findOne({ where: { id: leaderId } }));
    }
    async attachLeaders(items) {
        if (items.length === 0)
            return [];
        const memberIds = new Set();
        const ministerIds = new Set();
        const unknownIds = new Set();
        for (const item of items) {
            if (!item.leader_id)
                continue;
            if (item.leader_type === 'minister')
                ministerIds.add(item.leader_id);
            else if (item.leader_type === 'member')
                memberIds.add(item.leader_id);
            else
                unknownIds.add(item.leader_id);
        }
        const [members, ministers, unknownMembers, unknownMinisters] = await Promise.all([
            memberIds.size ? this.membersRepository.find({ where: { id: (0, typeorm_2.In)([...memberIds]) } }) : Promise.resolve([]),
            ministerIds.size ? this.ministersRepository.find({ where: { id: (0, typeorm_2.In)([...ministerIds]) } }) : Promise.resolve([]),
            unknownIds.size ? this.membersRepository.find({ where: { id: (0, typeorm_2.In)([...unknownIds]) } }) : Promise.resolve([]),
            unknownIds.size ? this.ministersRepository.find({ where: { id: (0, typeorm_2.In)([...unknownIds]) } }) : Promise.resolve([]),
        ]);
        const byKey = new Map();
        for (const m of members)
            byKey.set(`member:${m.id}`, this.fromMember(m));
        for (const m of ministers)
            byKey.set(`minister:${m.id}`, this.fromMinister(m));
        for (const m of unknownMembers)
            byKey.set(`unknown:${m.id}`, this.fromMember(m));
        for (const m of unknownMinisters) {
            if (!byKey.has(`unknown:${m.id}`))
                byKey.set(`unknown:${m.id}`, this.fromMinister(m));
        }
        return items.map((item) => {
            var _a, _b;
            if (!item.leader_id)
                return { ...item, leader: null };
            if (item.leader_type === 'minister' || item.leader_type === 'member') {
                return {
                    ...item,
                    leader: (_a = byKey.get(`${item.leader_type}:${item.leader_id}`)) !== null && _a !== void 0 ? _a : null,
                };
            }
            return {
                ...item,
                leader: (_b = byKey.get(`unknown:${item.leader_id}`)) !== null && _b !== void 0 ? _b : null,
            };
        });
    }
    fromMember(member) {
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
        };
    }
    fromMinister(minister) {
        if (!minister)
            return null;
        return {
            id: minister.id,
            first_name: minister.first_name,
            middle_name: minister.middle_name,
            last_name: minister.last_name,
            email: minister.email,
            phone: minister.phone,
            title: minister.title,
            type: 'minister',
        };
    }
};
exports.LeaderResolverService = LeaderResolverService;
exports.LeaderResolverService = LeaderResolverService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(member_entity_1.Member)),
    __param(1, (0, typeorm_1.InjectRepository)(minister_entity_1.Minister)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], LeaderResolverService);
