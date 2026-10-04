import { IsOptional, IsString, Length } from "class-validator";

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @Length(2, 30)
    nickname?: string;
}