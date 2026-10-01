import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { toUserResponse } from "../users/user.mapper";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private parseFullName(fullName: string) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return { first_name: "User", middle_name: "", last_name: "User" };
    }
    if (parts.length === 1) {
      return { first_name: parts[0], middle_name: "", last_name: parts[0] };
    }
    return {
      first_name: parts[0],
      middle_name: parts.slice(1, -1).join(" "),
      last_name: parts[parts.length - 1],
    };
  }

  async register(registerDto: RegisterDto) {
    const allowPublicRegister =
      this.config.get<string>("ALLOW_PUBLIC_REGISTER") === "true";
    if (!allowPublicRegister) {
      throw new ForbiddenException("Registration is disabled");
    }

    const email = registerDto.email.trim().toLowerCase();
    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    const newUser = await this.usersService.create({
      ...this.parseFullName(registerDto.fullName),
      email,
      password: registerDto.password,
      role: "staff",
      is_active: true,
    });

    return {
      message: "User registered successfully",
      user: newUser,
    };
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.is_active) {
      throw new UnauthorizedException("Account is inactive");
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload = { sub: user.id, email: user.email };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: toUserResponse(user, true),
    };
  }
}
