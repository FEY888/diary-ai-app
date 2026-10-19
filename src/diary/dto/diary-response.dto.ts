import { ApiProperty } from '@nestjs/swagger';

export class DiaryResponseDto {
  @ApiProperty({
    description: '다이어리 ID',
    example: 4,
  })
  id!: number;

  @ApiProperty({
    description: '다이어리 제목',
    example: '알찬 하루',
  })
  title!: string;

  @ApiProperty({
    description: '다이어리 내용',
    example: '백엔드 공부가 재밌다.',
  })
  content!: string;

  @ApiProperty({
    description: '다이어리를 작성한 날짜',
    example: '2026-10-19',
  })
  diaryDate!: string;

  @ApiProperty({
    description: '다이어리 생성 시각',
    example: '2026-10-19T10:30:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: '다이어리 마지막 수정 시각',
    example: '2026-10-19T11:00:00.000Z',
  })
  updatedAt!: Date;
}