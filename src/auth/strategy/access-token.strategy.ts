import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtUser } from "../types/jwt-user.type";




@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
    Strategy,
    // 이름짓기
    'jwt-access-token',
) {
    constructor(
        private readonly configService: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.getOrThrow('JWT_ACCESS_SECRET')
        });
    }

    // 인증완료되고난 후 유저정보 리턴 함수
    validate(payload: JwtUser) {
        return payload;
    }
}