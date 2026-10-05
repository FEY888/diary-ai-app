
export class DiaryAnalysisResponseDto {
    id!: number;
    summary!: string;
    primaryEmotion!: string;
    keywords!: string[];
    concerns!: string[];
    needs!: string[];
    createAt!: Date;

}