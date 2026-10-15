import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Diary } from './entities/diary.entity';
import { UsersService } from '../users/users.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { DiaryAnalysis } from '../diary_analysis/entities/diary_analysis.entity';
import { DiaryPaginationDto } from './dto/diary-pagination.dto';


@Injectable()
export class DiaryService {
    constructor(
        @InjectRepository(Diary)
        private readonly diaryRepository: Repository<Diary>,
        @InjectRepository(DiaryAnalysis)
        private readonly diaryAnalysisRepository: Repository<DiaryAnalysis>,
        private readonly usersService: UsersService,
    ) {}

    // 다이어리 작성(생성)
    async create(
        userId: string,
        createDiaryDto: CreateDiaryDto
    ) {
        const user = await this.usersService.findById(userId);

        const diary = this.diaryRepository.create({
            ...createDiaryDto,
            user,
        });

        return this.diaryRepository.save(diary);
    }
    
    // 내 다이어리 목록 조회(page pagination)
    async diaryFindAll(userId: string, diaryPaginationDto: DiaryPaginationDto) {
        const [diaries, count] = await this.diaryRepository.findAndCount({
            where: {
                user: {
                    id: userId,
                },
            },
            skip: diaryPaginationDto.take * (diaryPaginationDto.page - 1),
            take: diaryPaginationDto.take,
            
            order: {
                diaryDate: 'DESC',
            },
        });

        return {
            data: diaries,
            total: count,
        };
    }

    // 내 다이어리 1개 상세 조회
    async diaryFindOne(userId: string, diaryId: number,) {
        const diary = await this.diaryRepository.findOne({
            where: {
                id: diaryId,
                user: {
                    id: userId,
                },
            },
        });

        
        if(!diary) {
            throw new NotFoundException('다이어리를 찾을 수 없습니다.');
        }
        return diary;
    }

    // 일기 수정 업데이트
    async updateDiary(userId: string, diaryId: number, updateDiaryDto: UpdateDiaryDto) {
        const diary = await this.diaryFindOne(userId, diaryId);

        const isContentChanged = updateDiaryDto.content ! == undefined && updateDiaryDto.content !== diary.content;

        this.diaryRepository.merge(
            diary,
            updateDiaryDto,
        );

        const updateDiary = await this.diaryRepository.save(diary);

        if(isContentChanged) {
            await this.diaryAnalysisRepository.delete({
                diary: {
                    id: diaryId,
                }
            });

            return updateDiary;
        }

    }

    // 다이어리 삭제
    async removeDiary(userId: string, diaryId: number) {
        const diary = await this.diaryFindOne(userId, diaryId);

        return this.diaryRepository.remove(diary);
    }


}
