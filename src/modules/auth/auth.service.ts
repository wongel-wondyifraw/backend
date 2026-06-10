import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    private parseFullName(fullName: string) {
        const parts = fullName.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) {
            return { first_name: 'User', middle_name: '', last_name: 'User' };
        }
        if (parts.length === 1) {
            return { first_name: parts[0], middle_name: '', last_name: parts[0] };
        }
        return {
            first_name: parts[0],
            middle_name: parts.slice(1, -1).join(' '),
            last_name: parts[parts.length - 1],
        };
    }

    async register(registerDto: RegisterDto) {
        const email = registerDto.email.trim().toLowerCase();
        const existingUser = await this.usersService.findOneByEmail(email);
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const newUser = await this.usersService.create({
            ...this.parseFullName(registerDto.fullName),
            email,
            password: registerDto.password,
            role: 'staff',
            is_active: true,
        });

        delete (newUser as any).password_hash;

        return {
            message: 'User registered successfully',
            user: newUser,
        };
    }

    async login(loginDto: LoginDto) {
        const email = loginDto.email.trim().toLowerCase();
        const user = await this.usersService.findOneByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.is_active) {
            throw new UnauthorizedException('Account is inactive');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: user.id, email: user.email };

        return {
            access_token: await this.jwtService.signAsync(payload),
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                middle_name: user.middle_name,
                last_name: user.last_name,
                role: user.role,
                avatar_url: user.avatar_url,
            }
        };
    }
}
