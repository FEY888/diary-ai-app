import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class SignInDto {
    
    @ApiProperty({
        description: '로그인 이메일',
        example: 'test@example.com'
    })
    @IsEmail()
    email!: string;

    @ApiProperty({
        description:'로그인 비밀번호',
        example:'password1234'
    })
    @IsString()
    password!: string;
}