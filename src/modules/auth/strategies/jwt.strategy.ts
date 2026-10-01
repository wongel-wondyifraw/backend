import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { resolveJwtSecret } from "../../../common/config/jwt.config";
import { UsersService } from "../../users/users.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: { query?: { token?: string | string[] } }) => {
          const token = req?.query?.token;
          if (typeof token === "string" && token.length > 0) {
            return token;
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: resolveJwtSecret(configService),
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.usersService.findOneEntity(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    delete (user as { password_hash?: string }).password_hash;
    return user;
  }
}
