import { IsDateString, IsString, Length } from "class-validator";

export class CreateDiaryDto {
    
    @IsString()
    @Length(1, 30)
    title!: string;

    @IsString()
    @Length(1, 5000)
    content!: string;

    @IsDateString()
    diaryDate!: string;
}