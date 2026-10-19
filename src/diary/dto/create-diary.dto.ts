import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsString, Length } from "class-validator";

export class CreateDiaryDto {
    
    @ApiProperty({
        description: '다이어리 제목',
        example: '알찬 하루',
        minLength: 1,
        maxLength: 30,
    })
    @IsString()
    @Length(1, 30)
    title!: string;

    @ApiProperty({
        description: '다이어리 본문',
        example: '백엔드 개발 서적을 읽으며 새로운 지식을 습득했다.',
        minLength: 1,
        maxLength: 5000,
    })
    @IsString()
    @Length(1, 5000)
    content!: string;

    @ApiProperty({
        description: '다이어리 날짜',
        example: '2026-10-19'
    })
    @IsDateString()
    diaryDate!: string;
}