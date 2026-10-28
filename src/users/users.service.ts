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
        }
    });

    if(!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  // 사용자 프로필 닉네임 업데이트
  async updateProfile(userId: string, updateProfileDto:UpdateProfileDto) {
    await this.usersRepository.update(userId, updateProfileDto);
    
    return this.findById(userId);
  }

  // refreshTokenHash 저장용 업데이트
  async update(userId: string, data: Partial<Users>) {
    return this.usersRepository.update(userId, data);
  }
}