import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AccessTokenGuard } from '../auth/guard/access-token.guard';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 로그인한 사용자 정보 조회
  @UseGuards(AccessTokenGuard)
  @Get('me')
  getMe(
    @CurrentUser('sub') userId: string 
  ) {
    return this.usersService.findById(userId);
  }

  // 닉네임 업데이트 및 수정
  @UseGuards(AccessTokenGuard)
  @Patch('me')
  updateProfile(
    @CurrentUser('sub') userId:string,
    @Body() dto: UpdateProfileDto
  ) {
    return this.usersService.updateProfile(userId, dto);
  }
}
