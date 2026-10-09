import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { JwtService, type JwtSignOptions } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { toUserResponse } from "../users/user.mapper";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { RefreshToken } from "./entities/refresh-token.entity";
import { PasswordResetToken } from "./entities/password-reset-token.entity";
import { EmailVerificationToken } from "./entities/email-verification-token.entity";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import * as crypto from "crypto";
import { User } from "../users/entities/user.entity";
import { authenticator } from "otplib";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationTokenRepository: Repository<EmailVerificationToken>,
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
      created_via: "self_registration",
    });

    await this.sendVerificationEmail(newUser.id, email);

    return {
      message:
        "User registered successfully. Please check your email to verify your account.",
      user: newUser,
    };
  }

  async sendVerificationEmail(userId: string, email: string) {
    const tokenPlain = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(tokenPlain, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.emailVerificationTokenRepository.save(
      this.emailVerificationTokenRepository.create({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
    );

    // TODO: Send real email
    console.log(
      `[DEV] Email verification link: http://localhost:3000/verify-email?token=${tokenPlain}&email=${encodeURIComponent(email)}`,
    );
  }

  async verifyEmail(token: string, email: string) {
    const user = await this.usersService.findOneByEmail(
      email.trim().toLowerCase(),
    );
    if (!user) {
      throw new UnauthorizedException("Invalid token or email");
    }

    if (user.email_verified_at) {
      return { message: "Email is already verified" };
    }

    const tokens = await this.emailVerificationTokenRepository.find({
      where: { user_id: user.id },
    });

    let matchedToken: EmailVerificationToken | null = null;
    for (const t of tokens) {
      if (
        t.expires_at > new Date() &&
        (await bcrypt.compare(token, t.token_hash))
      ) {
        matchedToken = t;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException("Invalid or expired verification token");
    }

    await this.usersService.updateLoginStatus(user.id, {
      email_verified_at: new Date(),
    });
    await this.emailVerificationTokenRepository.delete({ user_id: user.id });

    return { message: "Email successfully verified" };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findOneByEmail(
      email.trim().toLowerCase(),
    );
    if (!user || user.email_verified_at) {
      return {
        message:
          "If that email address is in our database and unverified, we will send a new verification email.",
      };
    }

    await this.emailVerificationTokenRepository.delete({ user_id: user.id }); // delete old tokens
    await this.sendVerificationEmail(user.id, user.email);

    return {
      message:
        "If that email address is in our database and unverified, we will send a new verification email.",
    };
  }

  private async generateTokens(user: User, remember_me = false) {
    const payload = { sub: user.id, email: user.email };
    const sessionTtl = (this.config.get<string>("JWT_EXPIRES_IN") ??
      "15m") as JwtSignOptions["expiresIn"];

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: sessionTtl,
    });

    const refreshTokenPlain = crypto.randomBytes(32).toString("hex");
    const refreshTokenHash = await bcrypt.hash(refreshTokenPlain, 10);

    const refreshTokenExpiresAt = new Date();
    if (remember_me) {
      refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 30);
    } else {
      refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);
    }

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        user_id: user.id,
        token_hash: refreshTokenHash,
        expires_at: refreshTokenExpiresAt,
      })
    );

    return {
      access_token: accessToken,
      refresh_token: refreshTokenPlain,
      user: toUserResponse(user, true),
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

    if (user.locked_until && user.locked_until > new Date()) {
      await this.auditLogsService.logAction(
        "user.login_failed_locked",
        "user",
        user.id,
        null,
        { email },
      );
      const waitTime = Math.ceil(
        (user.locked_until.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account is locked. Try again in ${waitTime} minutes.`,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      const updates: {
        failed_login_attempts?: number;
        locked_until?: Date | null;
      } = { failed_login_attempts: failedAttempts };

      if (failedAttempts >= 5) {
        updates.locked_until = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await this.auditLogsService.logAction(
          "user.account_locked",
          "user",
          user.id,
          null,
          { email },
        );
      }

      await this.usersService.updateLoginStatus(user.id, updates);
      await this.auditLogsService.logAction(
        "user.login_failed",
        "user",
        user.id,
        null,
        { email },
      );

      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.mfa_enabled) {
      const mfaToken = await this.jwtService.signAsync(
        { sub: user.id, mfa: true, remember_me: loginDto.remember_me },
        { expiresIn: "5m" },
      );
      return { mfa_required: true, mfa_token: mfaToken };
    }

    if (user.failed_login_attempts > 0 || user.locked_until) {
      await this.usersService.updateLoginStatus(user.id, {
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date(),
      });
    } else {
      await this.usersService.updateLoginStatus(user.id, {
        last_login_at: new Date(),
      });
    }

    await this.auditLogsService.logAction(
      "user.login_success",
      "user",
      user.id,
      user.id,
      { email },
    );

    return this.generateTokens(user, loginDto.remember_me);
  }

  async verifyMfaChallenge(mfaToken: string, code: string) {
    try {
      const payload = await this.jwtService.verifyAsync(mfaToken);
      if (!payload.mfa || !payload.sub)
        throw new UnauthorizedException("Invalid MFA token");

      const user = await this.usersService.findOneEntity(payload.sub);
      if (!user || !user.mfa_secret)
        throw new UnauthorizedException("Invalid MFA state");

      const isValid = authenticator.verify({
        token: code,
        secret: user.mfa_secret,
      });

      if (!isValid) throw new UnauthorizedException("Invalid MFA code");

      await this.usersService.updateLoginStatus(user.id, {
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date(),
      });
      await this.auditLogsService.logAction(
        "user.login_success",
        "user",
        user.id,
        user.id,
        { email: user.email, mfa_used: true },
      );

      return this.generateTokens(user, payload.remember_me);
    } catch {
      throw new UnauthorizedException("Invalid or expired MFA token");
    }
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token is required");
    }

    const allTokens = await this.refreshTokenRepository.find({
      where: { revoked_at: IsNull() },
      relations: ["user"],
    });

    let matchedToken: RefreshToken | null = null;
    for (const token of allTokens) {
      if (
        token.expires_at > new Date() &&
        (await bcrypt.compare(refreshToken, token.token_hash))
      ) {
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const user = matchedToken.user;
    if (
      !user ||
      !user.is_active ||
      (user.locked_until && user.locked_until > new Date())
    ) {
      throw new UnauthorizedException("User account is not active");
    }

    const payload = { sub: user.id, email: user.email };
    const sessionTtl = (this.config.get<string>("JWT_EXPIRES_IN") ??
      "15m") as JwtSignOptions["expiresIn"];
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: sessionTtl,
    });

    return {
      access_token: accessToken,
    };
  }

  async generateMfaSecret(userId: string) {
    const user = await this.usersService.findOneEntity(userId);
    if (!user) throw new NotFoundException("User not found");

    const secret = authenticator.generateSecret();
    const appName = this.config.get<string>("APP_NAME") || "CMS";
    const otpauthUrl = authenticator.keyuri(user.email, appName, secret);

    await this.usersService.updateMfaSecret(userId, secret);

    return { secret, otpauthUrl };
  }

  async verifyMfaSetup(userId: string, token: string) {
    const user = await this.usersService.findOneEntity(userId);
    if (!user || !user.mfa_secret) {
      throw new BadRequestException("MFA setup not initiated");
    }

    const isValid = authenticator.verify({ token, secret: user.mfa_secret });

    if (!isValid) throw new UnauthorizedException("Invalid MFA code");

    await this.usersService.enableMfa(userId);
    return { message: "MFA enabled successfully" };
  }

  async disableMfa(userId: string) {
    await this.usersService.disableMfa(userId);
    return { message: "MFA disabled" };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return { message: "Logged out" };

    const allTokens = await this.refreshTokenRepository.find({
      where: { revoked_at: IsNull() },
    });

    for (const token of allTokens) {
      if (await bcrypt.compare(refreshToken, token.token_hash)) {
        token.revoked_at = new Date();
        await this.refreshTokenRepository.save(token);
        break;
      }
    }

    return { message: "Logged out successfully" };
  }

  async logoutAll(userId: string) {
    await this.refreshTokenRepository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revoked_at: new Date() })
      .where("user_id = :userId AND revoked_at IS NULL", { userId })
      .execute();

    return { message: "All sessions revoked" };
  }

  @OnEvent("user.force_logout")
  @OnEvent("user.deleted")
  async handleUserSessionRevocation(payload: { userId: string }) {
    await this.logoutAll(payload.userId);
  }

  async getSessions(userId: string) {
    const sessions = await this.refreshTokenRepository.find({
      where: { user_id: userId, revoked_at: IsNull() },
      order: { created_at: "DESC" },
    });

    return sessions.map((s) => ({
      id: s.id,
      device_info: s.device_info,
      ip_address: s.ip_address,
      created_at: s.created_at,
      expires_at: s.expires_at,
      is_expired: s.expires_at < new Date(),
    }));
  }

  async requestPasswordReset(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findOneByEmail(
      forgotPasswordDto.email.trim().toLowerCase(),
    );
    if (!user || !user.is_active) {
      // Always return success to prevent email enumeration
      return {
        message:
          "If that email address is in our database, we will send you an email to reset your password.",
      };
    }

    const tokenPlain = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(tokenPlain, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.passwordResetTokenRepository.save(
      this.passwordResetTokenRepository.create({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
    );

    await this.auditLogsService.logAction(
      "user.password_reset_requested",
      "user",
      user.id,
      user.id,
    );

    // TODO: Send email with tokenPlain
    // For now, we will just print it to the console in development
    console.log(
      `[DEV] Password reset link: http://localhost:3000/reset-password?token=${tokenPlain}&email=${encodeURIComponent(user.email)}`,
    );

    return {
      message:
        "If that email address is in our database, we will send you an email to reset your password.",
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto, email: string) {
    const user = await this.usersService.findOneByEmail(
      email.trim().toLowerCase(),
    );
    if (!user) {
      throw new UnauthorizedException("Invalid token or email");
    }

    const tokens = await this.passwordResetTokenRepository.find({
      where: { user_id: user.id, used_at: IsNull() },
    });

    let matchedToken: PasswordResetToken | null = null;
    for (const t of tokens) {
      if (
        t.expires_at > new Date() &&
        (await bcrypt.compare(resetPasswordDto.token, t.token_hash))
      ) {
        matchedToken = t;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException("Invalid or expired reset token");
    }

    await this.usersService.changePassword(
      user.id,
      { currentPassword: "", newPassword: resetPasswordDto.new_password },
      true,
    );

    if (!user.email_verified_at) {
      await this.usersService.updateLoginStatus(user.id, {
        email_verified_at: new Date(),
      });
    }

    matchedToken.used_at = new Date();
    await this.passwordResetTokenRepository.save(matchedToken);

    // Revoke all sessions
    await this.logoutAll(user.id);

    return { message: "Password has been successfully reset." };
  }
}
