import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { Public } from "../../common/decorators/public.decorator";
import { User } from "../users/entities/user.entity";

type AuthenticatedRequest = { user: User };

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("register")
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post("login")
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  refresh(@Body("refresh_token") refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("logout")
  logout(@Body("refresh_token") refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post("logout-all")
  logoutAll(@Req() req: AuthenticatedRequest) {
    return this.authService.logoutAll(req.user.id);
  }

  @Get("sessions")
  getSessions(@Req() req: AuthenticatedRequest) {
    return this.authService.getSessions(req.user.id);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post("forgot-password")
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(body);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post("reset-password")
  resetPassword(@Body() body: ResetPasswordDto & { email: string }) {
    return this.authService.resetPassword(body, body.email);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post("verify-email")
  verifyEmail(@Body() body: { token: string; email: string }) {
    return this.authService.verifyEmail(body.token, body.email);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post("resend-verification")
  resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerificationEmail(body.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post("mfa/setup")
  setupMfa(@Req() req: AuthenticatedRequest) {
    return this.authService.generateMfaSecret(req.user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post("mfa/verify")
  verifyMfaSetup(
    @Req() req: AuthenticatedRequest,
    @Body() body: { token: string },
  ) {
    return this.authService.verifyMfaSetup(req.user.id, body.token);
  }

  @HttpCode(HttpStatus.OK)
  @Post("mfa/disable")
  disableMfa(@Req() req: AuthenticatedRequest) {
    return this.authService.disableMfa(req.user.id);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("mfa/challenge")
  verifyMfaChallenge(@Body() body: { mfa_token: string; code: string }) {
    return this.authService.verifyMfaChallenge(body.mfa_token, body.code);
  }
}
