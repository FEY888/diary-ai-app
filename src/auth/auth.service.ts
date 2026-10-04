import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/sign-up.dto';
import * as argon2 from 'argon2';
import { SignInDto } from './dto/sign-in.dto';
import { Users } from '../users/entities/user.entity';
import { JwtUser } from './types/jwt-user.type';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { use } from 'passport';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    //  다이어리 회원가입
    async signUp(signUpDto:SignUpDto) {
        const existUser = await this.usersService.findByEmail(
            signUpDto.email
        );

        if(existUser) {
            throw new ConflictException('이미 사용중인 이메일입니다.');
        }
        const hashedPassword = await this.hashFn(signUpDto.password);
        const newUser = await this.usersService.create({
            ...signUpDto,
            password: hashedPassword
        });

        return newUser;
    }

    // hash 기능 
    private async hashFn(password:string) {
        return argon2.hash(password);
    }

    // 다이어리 로그인
    async signIn(signInDto: SignInDto) {
        const loginUser = await this.usersService.findByEmail(signInDto.email);
        
        if(!loginUser) {
            throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
        }

        const isPasswordValid = await argon2.verify(
            loginUser.password,
            signInDto.password,
        );

        if(!isPasswordValid) {
            throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
        }

        const tokens = await this.getTokens(loginUser);

        await this.updateRefreshToken(loginUser.id, tokens.refreshToken)

        return tokens;
    }

    // 로그아웃
    async signOut(userId: string) {
        await this.usersService.update(userId, {
            refreshTokenHash: null
        });

        return {
            message: '로그아웃 되었습니다.'
        };
    }

    // 토큰 발급
    private async getTokens(user: Users) {
        const payload: JwtUser = {
            sub: user.id,
            email:user.email,
            role: user.role,
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.getOrThrow<string>(
                    'JWT_ACCESS_SECRET'
                ),
                expiresIn: '15m',
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.getOrThrow<string>(
                    'JWT_REFRESH_SECRET'
                ),
                expiresIn:'7d',
            }),
        ]);
        return {accessToken, refreshToken};
    }

    // refreshToken hash 
    private async updateRefreshToken(userId:string, refreshToken: string) {
        const hashedRefreshToken = await this.hashFn(refreshToken);

        await this.usersService.update(userId, {
            refreshTokenHash: hashedRefreshToken
        });
    }

    // refreshToken 검증
    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.usersService.findById(userId);
        
        if(!user.refreshTokenHash) {
            throw new UnauthorizedException('로그인이 만료되었습니다.');
        }

        const isRefreshTokenValid = await argon2.verify(
            user.refreshTokenHash, refreshToken
        );

        if(!isRefreshTokenValid) {
            throw new UnauthorizedException('유효하지 않은 Refresh Token 입니다.');
        }

        const tokens = await this.getTokens(user);

        await this.updateRefreshToken(
            user.id,
            tokens.refreshToken
        );

        return tokens;
    }
}
