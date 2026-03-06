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
exports.MinistersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const minister_entity_1 = require("./entities/minister.entity");
const member_entity_1 = require("../members/entities/member.entity");
const user_entity_1 = require("../users/entities/user.entity");
const bcrypt = __importStar(require("bcrypt"));
let MinistersService = class MinistersService {
    constructor(ministersRepository, membersRepository, usersRepository) {
        this.ministersRepository = ministersRepository;
        this.membersRepository = membersRepository;
        this.usersRepository = usersRepository;
    }
    async create(createMinisterDto) {
        const { member_id, title, password } = createMinisterDto;
        // 1. Find the member
        const member = await this.membersRepository.findOne({ where: { id: member_id } });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID ${member_id} not found`);
        }
        if (!member.baptized) {
            throw new common_1.BadRequestException('Only baptized members can be ministers');
        }
        // 2. Check if a minister record already exists for this member
        const existingMinister = await this.ministersRepository.findOne({ where: { member_id } });
        if (existingMinister) {
            throw new common_1.BadRequestException('This member is already a minister');
        }
        // 3. Check if the member email is already used by an existing user
        const userEmail = member.email || `minister_${member_id.substring(0, 8)}@church.local`;
        const existingUser = await this.usersRepository.findOne({ where: { email: userEmail } });
        if (existingUser) {
            throw new common_1.BadRequestException(`An account with email ${userEmail} already exists.`);
        }
        let savedUser;
        try {
            // 4. Create User record (same pattern as UsersService.create)
            //    - Copy first_name, middle_name, last_name, email from Member
            //    - Map image_url -> avatar_url
            //    - Hash the password -> password_hash
            //    - Set role to 'minister', is_active to true
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const userData = {
                first_name: member.first_name,
                middle_name: member.middle_name || '',
                last_name: member.last_name,
                email: userEmail,
                password_hash: hashedPassword,
                role: 'minister',
                is_active: true,
                title: title,
                avatar_url: member.image_url || '', // Copy image_url -> avatar_url
                created_at: new Date(),
            };
            const userEntity = this.usersRepository.create(userData);
            savedUser = await this.usersRepository.save(userEntity);
        }
        catch (error) {
            console.error('Failed to create user for minister:', error === null || error === void 0 ? void 0 : error.message);
            throw new common_1.InternalServerErrorException(`Failed to create user account: ${error === null || error === void 0 ? void 0 : error.message}`);
        }
        try {
            // 5. Create Minister link record
            //    - minister_id is auto-generated (UUID)
            //    - user_id from the newly created User
            //    - member_id from the selected Member
            const ministerEntity = this.ministersRepository.create({
                user_id: savedUser.id,
                member_id: member.id,
            });
            const savedMinister = await this.ministersRepository.save(ministerEntity);
            return {
                message: 'Minister created successfully',
                minister: {
                    minister_id: savedMinister.minister_id,
                    user_id: savedUser.id,
                    member_id: member.id,
                },
                user: {
                    id: savedUser.id,
                    first_name: savedUser.first_name,
                    middle_name: savedUser.middle_name,
                    last_name: savedUser.last_name,
                    email: savedUser.email,
                    title: title,
                    avatar_url: savedUser.avatar_url,
                    role: savedUser.role,
                },
            };
        }
        catch (error) {
            // If minister creation fails, clean up the created user
            console.error('Failed to create minister record:', error === null || error === void 0 ? void 0 : error.message);
            await this.usersRepository.delete(savedUser.id);
            throw new common_1.InternalServerErrorException(`Failed to create minister record: ${error === null || error === void 0 ? void 0 : error.message}`);
        }
    }
    async findAll() {
        return this.ministersRepository.find({
            relations: ['user', 'member'],
        });
    }
    async findOne(minister_id) {
        const minister = await this.ministersRepository.findOne({
            where: { minister_id },
            relations: ['user', 'member']
        });
        if (!minister) {
            throw new common_1.NotFoundException(`Minister not found`);
        }
        return minister;
    }
    async remove(minister_id) {
        const result = await this.ministersRepository.delete({ minister_id });
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Minister not found`);
        }
        return { message: 'Minister deleted successfully' };
    }
};
exports.MinistersService = MinistersService;
exports.MinistersService = MinistersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(minister_entity_1.Minister)),
    __param(1, (0, typeorm_1.InjectRepository)(member_entity_1.Member)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MinistersService);
