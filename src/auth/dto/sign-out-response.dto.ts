import { ApiProperty } from '@nestjs/swagger';

export class SignOutResponseDto {
  @ApiProperty({
    description: '로그아웃 결과 메시지',
    example: '로그아웃 되었습니다.',
  })
  message!: string;
}