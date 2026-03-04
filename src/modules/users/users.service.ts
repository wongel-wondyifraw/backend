import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) { }

    async create(createUserDto: any): Promise<User> {
        // 1. Extract specifically what we need to transform
        const { password_hash, avatar, avatar_url, ...rest } = createUserDto;

        // 2. Build the entity data object manually to ensure avatar_url is included
        const userData: Partial<User> = {
            ...rest,
            avatar_url: avatar_url, // Mapping the string path specifically
            is_active: rest.is_active === 'true' || rest.is_active === true,
            created_at: rest.created_at || new Date(),
        };

        // 3. Handle Password Hashing
        if (password_hash) {
            const salt = await bcrypt.genSalt();
            userData.password_hash = await bcrypt.hash(password_hash, salt);
        }

        // 4. Save to Database
        const user = this.usersRepository.create(userData);
        return await this.usersRepository.save(user);
    }

    findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async findOne(id: string): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    async findOneByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { email },
            select: ['id', 'email', 'password_hash', 'first_name', 'middle_name', 'last_name', 'is_active', 'created_at', 'updated_at', 'role'] // Need to select password to check it during login
        });
    }

    async update(id: string, userData: any): Promise<User> {
        const { currentPassword, newPassword, ...otherData } = userData;
        const updateObject: Partial<User> = { ...otherData };

        if (currentPassword && newPassword) {
            // Fetch user with password_hash
            const user = await this.usersRepository.findOne({
                where: { id },
                select: ['id', 'password_hash'],
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            // Validate current password
            const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isMatch) {
                throw new ForbiddenException('Current password is incorrect');
            }

            // Hash new password and add to update object
            const salt = await bcrypt.genSalt(10);
            updateObject.password_hash = await bcrypt.hash(newPassword, salt);
        }

        // Perform update with only valid entity properties
        await this.usersRepository.update(id, updateObject);
        return this.findOne(id);
    }

    async updateAvatar(id: string, avatarUrl: string): Promise<void> {
        console.log(`Updating avatar for user ${id} to: ${avatarUrl}`);
        await this.usersRepository.update(id, { avatar_url: avatarUrl });
    }

    async changePassword(userId: string, changePasswordDto: any): Promise<{ message: string }> {
        const { currentPassword, newPassword } = changePasswordDto;

        // Fetch user with password_hash (it's hidden by default)
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            select: ['id', 'password_hash'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Validate current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            throw new ForbiddenException('Current password is incorrect');
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        // Update database with ONLY the new hash
        await this.usersRepository.update(userId, { password_hash: newHash });

        return { message: 'Password changed successfully' };
    }

    async remove(id: string): Promise<void> {
        const result = await this.usersRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
    }
}
