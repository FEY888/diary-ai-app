import { ApiProperty } from "@nestjs/swagger";

export class DiaryAnalysisResponseDto {
    @ApiProperty({
        description: 'AI 분석 ID',
        example: 1,
    })
    id!: number;

    @ApiProperty({
        description: '다이어리 본문 내용 요약',
        example: '오늘은 전반적으로 알찬 하루였다.',
    })
    summary!: string;

    @ApiProperty({
        description: '다이어리 내용 속 주요 감정',
        example: '행복',
    })
    primaryEmotion!: string;

    @ApiProperty({
        description: '다이어리 내용 속 주요 키워드',
        example: ['행복', '휴식', '공부'],
        type: [String],
    })
    keywords!: string[];

    @ApiProperty({
        description: '다이어리 내용 속 걱정거리',
        example: [],
        type: [String],
    })
    concerns!: string[];

    @ApiProperty({
        description: '다이어리 내용 분석 후 필요 사항',
        example: ['공부에 도움 되는 서적 추천'],
        type: [String],
    })
    needs!: string[];

    @ApiProperty({
        description: '다이어리 내용 AI 분석 생성 시각',
        example: '2026-10-18T22:30:00.000Z',
    })
    createdAt!: Date;

}