import { ApiProperty } from "@nestjs/swagger";

export class TokenResponseDto {
    @ApiProperty({
        description: 'API 요청에 사용하는 Access Token',
        example: 'eyjhbGci0iJIUZI1NISINR5cCI6...'
    })
    accessToken!: string;

    @ApiProperty({
        description: 'Access Token 재발급에 사용하는 Refresh Token',
        example: 'eyHJbGci01JIUzI1N/iIsInR5c...'
    })
    refreshToken!: string;

}