import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
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
        private readonly usersService: UsersService,
        private readonly dataSource: DataSource,
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

    // 다이어리 수정 업데이트(다이어리 내용 수정시 기존 ai 분석 삭제 트랜잭션 적용)
    async updateDiary(
        userId: string,
        diaryId: number,
        updateDiaryDto: UpdateDiaryDto
    ) {
        const diary = await this.diaryFindOne(userId, diaryId);

        const isContentChanged = 
        updateDiaryDto.content !== undefined && updateDiaryDto.content !== diary.content;
        
        this.diaryRepository.merge(diary,
            updateDiaryDto,
        );

        return this.dataSource.transaction(async (manager) => {
            const diaryRepository = manager.getRepository(Diary);

            const diaryAnalysisRepository = manager.getRepository(DiaryAnalysis);

            const updateDiary = await diaryRepository.save(diary);


            if(isContentChanged) {
                await diaryAnalysisRepository.delete({
                    diary: {
                        id: diaryId,
                    }
                });
            }
            
            return updateDiary;
        })
    }

    // 다이어리 삭제
    async removeDiary(userId: string, diaryId: number) {
        const diary = await this.diaryFindOne(userId, diaryId);

        return this.diaryRepository.remove(diary);
    }

    // 분석 요청 동시에 들어왔을 경우 postgresql 조건부 UPDATE 제어 시작
    async tryStartAnalysis(diaryId: number) {
        const result = await this.diaryRepository.update({
            id: diaryId,
            analysisStatus: 'IDLE',
        },
        {
            analysisStatus: 'PROCESSING',
    });

    return result.affected === 1;
    }
   
    // 분석 작업 제어 종료
    async finishAnalysis(diaryId: number) {
        await this.diaryRepository.update({
            id:diaryId,
            analysisStatus: 'PROCESSING',
        },
        {
            analysisStatus: 'IDLE',
        });
    }


}
