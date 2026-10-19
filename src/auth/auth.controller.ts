import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { AccessTokenGuard } from './guard/access-token.guard';
import { CurrentUser } from './decorator/current-user.decorator';
import { RefreshTokenGuard } from './guard/refresh-token.guard';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { TokenResponseDto } from './dto/token-response.dto';
import { SignOutResponseDto } from './dto/sign-out-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

   // 회원가입 
  @Post('signup')
  @ApiOperation({
    summary: '회원가입',
    description: '이메일, 닉네임, 비밀번호를 이용해 새로운 사용자를 생성합니다.',
  })
  @ApiCreatedResponse({
    description: '회원가입 성공',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: '이메일 형식, 비밀번호 규칙 등 요청 값 검증 실패',
  })
  @ApiConflictResponse({
    description: '이미 사용중인 이메일',
  })
  signUp(
    @Body() signUpDto: SignUpDto
  ) {
    return this.authService.signUp(signUpDto);
  }

  // 로그인
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '로그인',
    description: '이메일과 비밀번호를 검증하고 Access Token과 Refresh Token을 발급합니다.',
  })
  @ApiOkResponse({
    description: '로그인 성공',
    type: TokenResponseDto,
  })
  @ApiBadRequestResponse({
    description: '요청 값 검증 실패',
  })
  @ApiUnauthorizedResponse({
    description: '이메일 또는 비밀번호가 올바르지 않음',
  })
  signIn(
    @Body() signInDto: SignInDto
  ) {
    return this.authService.signIn(signInDto);
  }

  // 로그아웃
  
  @Post('signout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '로그아웃',
    description: '저장된 Refresh Token 정보를 제거하여 로그아웃 처리합니다.',
  })
  @ApiOkResponse({
    description: '로그아웃 성공',
    type: SignOutResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access Token이 없거나 유효하지 않음',
  })
  signOut(
    @CurrentUser('sub') userId: string
  ) {
    return this.authService.signOut(userId);
  }

  // 새 refreshToken 반환
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
     summary: '토큰 재발급',
     description: 'Refresh Token을 검증하고 새로운 Access Token과 Refresh Token을 발급합니다.',
  })
  @ApiOkResponse({
     description: '토큰 재발급 성공',
     type: TokenResponseDto,
  })
  @ApiUnauthorizedResponse({
     description: 'Refresh Token이 없거나 유효하지 않음',
})
  refreshTokens(
    @CurrentUser('sub') userId: string,
    @CurrentUser('refreshToken') refreshToken: string,
 ) {
    return this.authService.refreshTokens(userId, refreshToken);
}

}
