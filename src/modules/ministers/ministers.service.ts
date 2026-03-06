import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Minister } from './entities/minister.entity';
import { CreateMinisterDto } from './dto/create-minister.dto';
import { Member } from '../members/entities/member.entity';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MinistersService {
    constructor(
        @InjectRepository(Minister)
        private readonly ministersRepository: Repository<Minister>,
        @InjectRepository(Member)
        private readonly membersRepository: Repository<Member>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) { }

    async create(createMinisterDto: CreateMinisterDto) {
        const { member_id, title, password } = createMinisterDto;

        // 1. Find the member
        const member = await this.membersRepository.findOne({ where: { id: member_id } });
        if (!member) {
            throw new NotFoundException(`Member with ID ${member_id} not found`);
        }

        if (!member.baptized) {
            throw new BadRequestException('Only baptized members can be ministers');
        }

        // 2. Check if a minister record already exists for this member
        const existingMinister = await this.ministersRepository.findOne({ where: { member_id } });
        if (existingMinister) {
            throw new BadRequestException('This member is already a minister');
        }

        // 3. Check if the member email is already used by an existing user
        const userEmail = member.email || `minister_${member_id.substring(0, 8)}@church.local`;

        const existingUser = await this.usersRepository.findOne({ where: { email: userEmail } });
        if (existingUser) {
            throw new BadRequestException(`An account with email ${userEmail} already exists.`);
        }

        let savedUser: User;

        try {
            // 4. Create User record (same pattern as UsersService.create)
            //    - Copy first_name, middle_name, last_name, email from Member
            //    - Map image_url -> avatar_url
            //    - Hash the password -> password_hash
            //    - Set role to 'minister', is_active to true
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const userData: Partial<User> = {
                first_name: member.first_name,
                middle_name: member.middle_name || '',
                last_name: member.last_name,
                email: userEmail,
                password_hash: hashedPassword,
                role: 'minister',
                is_active: true,
                title: title,
                avatar_url: member.image_url || '',  // Copy image_url -> avatar_url
                created_at: new Date(),
            };

            const userEntity = this.usersRepository.create(userData);
            savedUser = await this.usersRepository.save(userEntity);

        } catch (error: any) {
            console.error('Failed to create user for minister:', error?.message);
            throw new InternalServerErrorException(
                `Failed to create user account: ${error?.message}`,
            );
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
        } catch (error: any) {
            // If minister creation fails, clean up the created user
            console.error('Failed to create minister record:', error?.message);
            await this.usersRepository.delete(savedUser.id);
            throw new InternalServerErrorException(
                `Failed to create minister record: ${error?.message}`,
            );
        }
    }

    async findAll() {
        return this.ministersRepository.find({
            relations: ['user', 'member'],
        });
    }

    async findOne(minister_id: string) {
        const minister = await this.ministersRepository.findOne({
            where: { minister_id },
            relations: ['user', 'member']
        });
        if (!minister) {
            throw new NotFoundException(`Minister not found`);
        }
        return minister;
    }

    async remove(minister_id: string) {
        const result = await this.ministersRepository.delete({ minister_id });
        if (result.affected === 0) {
            throw new NotFoundException(`Minister not found`);
        }
        return { message: 'Minister deleted successfully' };
    }
}
