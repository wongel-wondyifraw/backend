"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const member_entity_1 = require("./entities/member.entity");
const path_1 = require("path");
const fs = __importStar(require("fs/promises"));
let MembersService = class MembersService {
    constructor(membersRepository) {
        this.membersRepository = membersRepository;
    }
    async create(dto, avatar, doc) {
        // 1. Save member first to generate the UUID
        const member = await this.membersRepository.save(this.membersRepository.create(dto));
        const updateData = {};
        const baseDir = (0, path_1.join)(process.cwd(), 'uploads');
        // 2. Handle Avatar (Rename by UUID)
        // Check for .buffer to ensure it's a real file, not a metadata object
        if (avatar && avatar.buffer) {
            const avatarName = `${member.id}${(0, path_1.extname)(avatar.originalname)}`;
            const fullPath = (0, path_1.join)(baseDir, 'images', avatarName);
            await fs.mkdir((0, path_1.join)(baseDir, 'images'), { recursive: true });
            await fs.writeFile(fullPath, avatar.buffer);
            updateData.image_url = `/uploads/images/${avatarName}`;
        }
        // 3. Handle Document (Rename by UUID + Timestamp)
        if (doc && doc.buffer) {
            const timestamp = Date.now();
            const docName = `${member.id}_${timestamp}${(0, path_1.extname)(doc.originalname)}`;
            const fullPath = (0, path_1.join)(baseDir, 'documents', docName);
            await fs.mkdir((0, path_1.join)(baseDir, 'documents'), { recursive: true });
            await fs.writeFile(fullPath, doc.buffer);
            updateData.document_url = `/uploads/documents/${docName}`;
        }
        // 4. Final Update if files were uploaded
        if (Object.keys(updateData).length > 0) {
            await this.membersRepository.update(member.id, updateData);
            return { ...member, ...updateData };
        }
        return member;
    }
    async findAll() {
        return this.membersRepository.find({
            order: { created_at: 'DESC' },
        });
    }
    async findOne(id) {
        const member = await this.membersRepository.findOne({ where: { id } });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID ${id} not found`);
        }
        return member;
    }
    async update(id, updateMemberDto) {
        await this.membersRepository.update(id, updateMemberDto);
        return this.findOne(id);
    }
    async remove(id) {
        const result = await this.membersRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Member with ID ${id} not found`);
        }
    }
};
exports.MembersService = MembersService;
exports.MembersService = MembersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(member_entity_1.Member)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MembersService);
