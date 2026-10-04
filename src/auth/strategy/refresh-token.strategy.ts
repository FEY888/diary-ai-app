import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { JwtUser } from "../types/jwt-user.type";

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
    Strategy,
    'jwt-refresh-token'
) {
    constructor(
        private readonly configService:ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.getOrThrow('JWT_REFRESH_SECRET'),
            passReqToCallback: true,
        });
        
    }
    validate(req: Request, payload: JwtUser) {
        const authorization = req.get('Authorization');
        if(!authorization) {
            throw new UnauthorizedException('RefreshToken이 없습니다.');
        }
    
        const refreshToken = authorization.replace('Bearer', '').trim();
        return {...payload, refreshToken};
    }
}