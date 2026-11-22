import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}

  // 유저 생성
  async create(createUserDto: CreateUserDto): Promise<Users> {
    const user = this.usersRepository.create(createUserDto);

    return this.usersRepository.save(user);
  }

  // 이메일 중복 확인
  async findByEmail(email: string): Promise<Users | null> {
    return this.usersRepository.findOne({
      where: {
        email,
      },
    });
  }

  // 사용자 조회
  async findById(id: string): Promise<Users> {
    const user = await this.usersRepository.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  // 사용자 프로필 닉네임 업데이트
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    if (updateProfileDto.nickname === undefined) {
      return this.findById(userId);
    }

    await this.usersRepository.update(userId, updateProfileDto);

    return this.findById(userId);
  }

  // refreshTokenHash 저장용 업데이트
  async update(userId: string, data: Partial<Users>) {
    return this.usersRepository.update(userId, data);
  }

  // refreshToken 조건부 저장
  // - 검증에 사용한 해시가 DB에 그대로 있을 때만 새 해시로 교체한다.
  // - 로그아웃이 먼저 해시를 지웠다면, 진행 중이던 재발급은 새 해시를 저장할 수 없다.
  async replaceRefreshToken(
    userId: string,
    previousHash: string,
    newHash: string,
  ) {
    const result = await this.usersRepository.update(
      {
        id: userId,
        refreshTokenHash: previousHash,
      },
      { refreshTokenHash: newHash },
    );

    return result.affected === 1;
  }
}
