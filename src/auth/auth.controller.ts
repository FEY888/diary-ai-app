import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { AccessTokenGuard } from './guard/access-token.guard';
import { CurrentUser } from './decorator/current-user.decorator';
import { RefreshTokenGuard } from './guard/refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

   // 회원가입 
  @Post('signup')
  signUp(
    @Body() signUpDto: SignUpDto
  ) {
    return this.authService.signUp(signUpDto);
  }

  // 로그인
  @Post('signin')
  signIn(
    @Body() signInDto: SignInDto
  ) {
    return this.authService.signIn(signInDto);
  }

  // 로그아웃
  @UseGuards(AccessTokenGuard)
  @Post('signout')
  signOut(
    @CurrentUser('sub') userId: string
  ) {
    return this.authService.signOut(userId);
  }

  // 새 refreshToken 반환
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
    refreshTokens(
      @CurrentUser('sub') userId: string,
      @CurrentUser('refreshToken') refreshToken: string, 
    ) {
      return this.authService.refreshTokens(
        userId,
        refreshToken,
      );
    }

}
