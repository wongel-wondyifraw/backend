import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                (req: { query?: { token?: string } }) => req.query?.token ?? null,
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET', 'super-secret-key'),
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
