import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AccessTokenGuard } from '../auth/guard/access-token.guard';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ApiAcceptedResponse, ApiBadRequestResponse, ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { ApiAccessTokenResponse } from '../common/swagger/api-auth-response.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@ApiAccessTokenResponse()
@UseGuards(AccessTokenGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 로그인한 사용자 정보 조회
  @Get('me')
  @ApiOperation({
    summary: '내 정보 조회',
    description: '로그인한 사용자의 정보를 조회합니다.',
  })
  @ApiOkResponse({
    description: '사용자 정보 조회 성공',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: '사용자를 찾을 수 없음',
  })
  getMe(
    @CurrentUser('sub') userId: string 
  ) {
    return this.usersService.findById(userId);
  }

  // 닉네임 업데이트 및 수정
  @Patch('me')
  @ApiOperation({ 
    summary: '내 정보 수정' 
  })
  @ApiOkResponse({
    description: '내 정보 수정 성공',
  type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: '수정 요청 값 검증 실패',
  })
  @ApiNotFoundResponse({
    description: '사용자를 찾을 수 없음',
  })
  updateProfile(
    @CurrentUser('sub') userId:string,
    @Body() dto: UpdateProfileDto
  ) {
    return this.usersService.updateProfile(userId, dto);
  }
}
