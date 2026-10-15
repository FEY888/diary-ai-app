import { Type } from "class-transformer";
import { IsIn, IsInt, Max, Min } from "class-validator";

export class DiaryPaginationDto {

    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    take: number = 20;
}