import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class CreateUserDto {

  @ApiProperty({
    description:'사용자 이메일',
    example: 'test@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: '사용자 닉네임',
    example: 'tester1',
    minLength: 2,
    maxLength: 30,
  })
  @IsString()
  @Length(2, 30)
  nickname!: string;

  @ApiProperty({
    description: '사용자 비밀번호',
    example: 'password1234',
    minLength: 8,
  })
  @IsString()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, {
  message: '비밀번호는 8자 이상이며 영문과 숫자를 포함해야 합니다.',
})
  password!: string;
}
