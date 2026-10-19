import { ApiProperty } from '@nestjs/swagger';
import { DiaryResponseDto } from './diary-response.dto';

export class DiaryListResponseDto {
  @ApiProperty({
    description: '다이어리 목록',
    type: [DiaryResponseDto],
  })
  data!: DiaryResponseDto[];

  @ApiProperty({
    description: '전체 다이어리 개수',
    example: 101,
  })
  total!: number;
}