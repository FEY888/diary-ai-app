import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;


  @IsString()
  @Length(2, 30)
  nickname!: string;

  @IsString()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, {
  message: '비밀번호는 8자 이상이며 영문과 숫자를 포함해야 합니다.',
})
  password!: string;
}
