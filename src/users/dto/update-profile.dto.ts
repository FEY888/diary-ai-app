import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Length, ValidateIf } from "class-validator";

export class UpdateProfileDto {

    @ApiPropertyOptional({
        description: '변경할 사용자 닉네임',
        example: 'newTest',
        minLength: 2,
        maxLength: 30,
    })
    @ValidateIf((_,value) => value !== undefined)
    @IsString()
    @Length(2, 30)
    nickname?: string;
}