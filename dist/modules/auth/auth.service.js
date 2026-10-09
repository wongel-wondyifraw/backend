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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const users_service_1 = require("../users/users.service");
const user_mapper_1 = require("../users/user.mapper");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const refresh_token_entity_1 = require("./entities/refresh-token.entity");
const password_reset_token_entity_1 = require("./entities/password-reset-token.entity");
const email_verification_token_entity_1 = require("./entities/email-verification-token.entity");
const crypto = __importStar(require("crypto"));
const otplib_1 = require("otplib");
let AuthService = class AuthService {
    constructor(usersService, jwtService, config, auditLogsService, refreshTokenRepository, passwordResetTokenRepository, emailVerificationTokenRepository) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.config = config;
        this.auditLogsService = auditLogsService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
    }
    parseFullName(fullName) {
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
    async register(registerDto) {
        const allowPublicRegister = this.config.get("ALLOW_PUBLIC_REGISTER") === "true";
        if (!allowPublicRegister) {
            throw new common_1.ForbiddenException("Registration is disabled");
        }
        const email = registerDto.email.trim().toLowerCase();
        const existingUser = await this.usersService.findOneByEmail(email);
        if (existingUser) {
            throw new common_1.ConflictException("Email already exists");
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
            message: "User registered successfully. Please check your email to verify your account.",
            user: newUser,
        };
    }
    async sendVerificationEmail(userId, email) {
        const tokenPlain = crypto.randomBytes(32).toString("hex");
        const tokenHash = await bcrypt.hash(tokenPlain, 10);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await this.emailVerificationTokenRepository.save({
            user_id: userId,
            token_hash: tokenHash,
            expires_at: expiresAt,
        });
        // TODO: Send real email
        console.log(`[DEV] Email verification link: http://localhost:3000/verify-email?token=${tokenPlain}&email=${encodeURIComponent(email)}`);
    }
    async verifyEmail(token, email) {
        const user = await this.usersService.findOneByEmail(email.trim().toLowerCase());
        if (!user) {
            throw new common_1.UnauthorizedException("Invalid token or email");
        }
        if (user.email_verified_at) {
            return { message: "Email is already verified" };
        }
        const tokens = await this.emailVerificationTokenRepository.find({
            where: { user_id: user.id },
        });
        let matchedToken = null;
        for (const t of tokens) {
            if (t.expires_at > new Date() &&
                (await bcrypt.compare(token, t.token_hash))) {
                matchedToken = t;
                break;
            }
        }
        if (!matchedToken) {
            throw new common_1.UnauthorizedException("Invalid or expired verification token");
        }
        await this.usersService.updateLoginStatus(user.id, {
            email_verified_at: new Date(),
        });
        await this.emailVerificationTokenRepository.delete({ user_id: user.id });
        return { message: "Email successfully verified" };
    }
    async resendVerificationEmail(email) {
        const user = await this.usersService.findOneByEmail(email.trim().toLowerCase());
        if (!user || user.email_verified_at) {
            return {
                message: "If that email address is in our database and unverified, we will send a new verification email.",
            };
        }
        await this.emailVerificationTokenRepository.delete({ user_id: user.id }); // delete old tokens
        await this.sendVerificationEmail(user.id, user.email);
        return {
            message: "If that email address is in our database and unverified, we will send a new verification email.",
        };
    }
    async generateTokens(user, remember_me = false) {
        var _a;
        const payload = { sub: user.id, email: user.email };
        const sessionTtl = ((_a = this.config.get("JWT_EXPIRES_IN")) !== null && _a !== void 0 ? _a : "15m");
        const accessToken = await this.jwtService.signAsync(payload, {
            expiresIn: sessionTtl,
        });
        const refreshTokenPlain = crypto.randomBytes(32).toString("hex");
        const refreshTokenHash = await bcrypt.hash(refreshTokenPlain, 10);
        const refreshTokenExpiresAt = new Date();
        if (remember_me) {
            refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 30);
        }
        else {
            refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);
        }
        await this.refreshTokenRepository.save({
            user_id: user.id,
            token_hash: refreshTokenHash,
            expires_at: refreshTokenExpiresAt,
        });
        return {
            access_token: accessToken,
            refresh_token: refreshTokenPlain,
            user: (0, user_mapper_1.toUserResponse)(user, true),
        };
    }
    async login(loginDto) {
        const email = loginDto.email.trim().toLowerCase();
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        if (!user.is_active) {
            throw new common_1.UnauthorizedException("Account is inactive");
        }
        if (user.locked_until && user.locked_until > new Date()) {
            await this.auditLogsService.logAction("user.login_failed_locked", "user", user.id, null, { email });
            const waitTime = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000);
            throw new common_1.UnauthorizedException(`Account is locked. Try again in ${waitTime} minutes.`);
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);
        if (!isPasswordValid) {
            const failedAttempts = (user.failed_login_attempts || 0) + 1;
            const updates = { failed_login_attempts: failedAttempts };
            if (failedAttempts >= 5) {
                updates.locked_until = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
                await this.auditLogsService.logAction("user.account_locked", "user", user.id, null, { email });
            }
            await this.usersService.updateLoginStatus(user.id, updates);
            await this.auditLogsService.logAction("user.login_failed", "user", user.id, null, { email });
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        if (user.mfa_enabled) {
            const mfaToken = await this.jwtService.signAsync({ sub: user.id, mfa: true, remember_me: loginDto.remember_me }, { expiresIn: "5m" });
            return { mfa_required: true, mfa_token: mfaToken };
        }
        if (user.failed_login_attempts > 0 || user.locked_until) {
            await this.usersService.updateLoginStatus(user.id, {
                failed_login_attempts: 0,
                locked_until: null,
                last_login_at: new Date(),
            });
        }
        else {
            await this.usersService.updateLoginStatus(user.id, {
                last_login_at: new Date(),
            });
        }
        await this.auditLogsService.logAction("user.login_success", "user", user.id, user.id, { email });
        return this.generateTokens(user, loginDto.remember_me);
    }
    async verifyMfaChallenge(mfaToken, code) {
        try {
            const payload = await this.jwtService.verifyAsync(mfaToken);
            if (!payload.mfa || !payload.sub)
                throw new common_1.UnauthorizedException("Invalid MFA token");
            const user = await this.usersService.findOneEntity(payload.sub);
            if (!user || !user.mfa_secret)
                throw new common_1.UnauthorizedException("Invalid MFA state");
            const isValid = otplib_1.authenticator.verify({
                token: code,
                secret: user.mfa_secret,
            });
            if (!isValid)
                throw new common_1.UnauthorizedException("Invalid MFA code");
            await this.usersService.updateLoginStatus(user.id, {
                failed_login_attempts: 0,
                locked_until: null,
                last_login_at: new Date(),
            });
            await this.auditLogsService.logAction("user.login_success", "user", user.id, user.id, { email: user.email, mfa_used: true });
            return this.generateTokens(user, payload.remember_me);
        }
        catch (_a) {
            throw new common_1.UnauthorizedException("Invalid or expired MFA token");
        }
    }
    async refresh(refreshToken) {
        var _a;
        if (!refreshToken) {
            throw new common_1.UnauthorizedException("Refresh token is required");
        }
        const allTokens = await this.refreshTokenRepository.find({
            where: { revoked_at: (0, typeorm_2.IsNull)() },
            relations: ["user"],
        });
        let matchedToken = null;
        for (const token of allTokens) {
            if (token.expires_at > new Date() &&
                (await bcrypt.compare(refreshToken, token.token_hash))) {
                matchedToken = token;
                break;
            }
        }
        if (!matchedToken) {
            throw new common_1.UnauthorizedException("Invalid or expired refresh token");
        }
        const user = matchedToken.user;
        if (!user ||
            !user.is_active ||
            (user.locked_until && user.locked_until > new Date())) {
            throw new common_1.UnauthorizedException("User account is not active");
        }
        const payload = { sub: user.id, email: user.email };
        const sessionTtl = ((_a = this.config.get("JWT_EXPIRES_IN")) !== null && _a !== void 0 ? _a : "15m");
        const accessToken = await this.jwtService.signAsync(payload, {
            expiresIn: sessionTtl,
        });
        return {
            access_token: accessToken,
        };
    }
    async generateMfaSecret(userId) {
        const user = await this.usersService.findOneEntity(userId);
        if (!user)
            throw new common_1.NotFoundException("User not found");
        const secret = otplib_1.authenticator.generateSecret();
        const appName = this.config.get("APP_NAME") || "CMS";
        const otpauthUrl = otplib_1.authenticator.keyuri(user.email, appName, secret);
        await this.usersService.updateMfaSecret(userId, secret);
        return { secret, otpauthUrl };
    }
    async verifyMfaSetup(userId, token) {
        const user = await this.usersService.findOneEntity(userId);
        if (!user || !user.mfa_secret) {
            throw new common_1.BadRequestException("MFA setup not initiated");
        }
        const isValid = otplib_1.authenticator.verify({ token, secret: user.mfa_secret });
        if (!isValid)
            throw new common_1.UnauthorizedException("Invalid MFA code");
        await this.usersService.enableMfa(userId);
        return { message: "MFA enabled successfully" };
    }
    async disableMfa(userId) {
        await this.usersService.disableMfa(userId);
        return { message: "MFA disabled" };
    }
    async logout(refreshToken) {
        if (!refreshToken)
            return { message: "Logged out" };
        const allTokens = await this.refreshTokenRepository.find({
            where: { revoked_at: (0, typeorm_2.IsNull)() },
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
    async logoutAll(userId) {
        await this.refreshTokenRepository
            .createQueryBuilder()
            .update(refresh_token_entity_1.RefreshToken)
            .set({ revoked_at: new Date() })
            .where("user_id = :userId AND revoked_at IS NULL", { userId })
            .execute();
        return { message: "All sessions revoked" };
    }
    async handleUserSessionRevocation(payload) {
        await this.logoutAll(payload.userId);
    }
    async getSessions(userId) {
        const sessions = await this.refreshTokenRepository.find({
            where: { user_id: userId, revoked_at: (0, typeorm_2.IsNull)() },
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
    async requestPasswordReset(forgotPasswordDto) {
        const user = await this.usersService.findOneByEmail(forgotPasswordDto.email.trim().toLowerCase());
        if (!user || !user.is_active) {
            // Always return success to prevent email enumeration
            return {
                message: "If that email address is in our database, we will send you an email to reset your password.",
            };
        }
        const tokenPlain = crypto.randomBytes(32).toString("hex");
        const tokenHash = await bcrypt.hash(tokenPlain, 10);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await this.passwordResetTokenRepository.save({
            user_id: user.id,
            token_hash: tokenHash,
            expires_at: expiresAt,
        });
        await this.auditLogsService.logAction("user.password_reset_requested", "user", user.id, user.id);
        // TODO: Send email with tokenPlain
        // For now, we will just print it to the console in development
        console.log(`[DEV] Password reset link: http://localhost:3000/reset-password?token=${tokenPlain}&email=${encodeURIComponent(user.email)}`);
        return {
            message: "If that email address is in our database, we will send you an email to reset your password.",
        };
    }
    async resetPassword(resetPasswordDto, email) {
        const user = await this.usersService.findOneByEmail(email.trim().toLowerCase());
        if (!user) {
            throw new common_1.UnauthorizedException("Invalid token or email");
        }
        const tokens = await this.passwordResetTokenRepository.find({
            where: { user_id: user.id, used_at: (0, typeorm_2.IsNull)() },
        });
        let matchedToken = null;
        for (const t of tokens) {
            if (t.expires_at > new Date() &&
                (await bcrypt.compare(resetPasswordDto.token, t.token_hash))) {
                matchedToken = t;
                break;
            }
        }
        if (!matchedToken) {
            throw new common_1.UnauthorizedException("Invalid or expired reset token");
        }
        await this.usersService.changePassword(user.id, { currentPassword: "", newPassword: resetPasswordDto.new_password }, true);
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
};
exports.AuthService = AuthService;
__decorate([
    (0, event_emitter_1.OnEvent)("user.force_logout"),
    (0, event_emitter_1.OnEvent)("user.deleted"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthService.prototype, "handleUserSessionRevocation", null);
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, typeorm_1.InjectRepository)(refresh_token_entity_1.RefreshToken)),
    __param(5, (0, typeorm_1.InjectRepository)(password_reset_token_entity_1.PasswordResetToken)),
    __param(6, (0, typeorm_1.InjectRepository)(email_verification_token_entity_1.EmailVerificationToken)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        audit_logs_service_1.AuditLogsService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AuthService);
