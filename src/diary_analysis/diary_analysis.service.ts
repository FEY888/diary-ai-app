import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DiaryService } from '../diary/diary.service';
import { InjectRepository } from '@nestjs/typeorm';
import { DiaryAnalysis } from './entities/diary_analysis.entity';
import { Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';

@Injectable()
export class DiaryAnalysisService {
    constructor(
        @InjectRepository(DiaryAnalysis)
        private readonly diaryAnalysisRepository: Repository<DiaryAnalysis>,
        private readonly diaryService: DiaryService,
        private readonly aiService: AiService

    ) {}

    // ai 분석 생성
    async createAnalysis(userId: string, diaryId: number) {
  const diary = await this.diaryService.diaryFindOne(userId, diaryId);

  const existAnalysis = await this.diaryAnalysisRepository.findOne({
    where: {
      diary: {
        id: diaryId,
      },
    },
  });

  if (existAnalysis) {
    console.log('기존 분석 반환:', existAnalysis);
    return existAnalysis;
  }
  console.log('새 ai 분석 실행');

  const aiResult = await this.aiService.analyzeDiary(diary.content);

  const analysis = this.diaryAnalysisRepository.create({
    diary,
    ...aiResult,
  });

  return this.diaryAnalysisRepository.save(analysis);
}

    // 다이어리 ai 분석 조회
    async findAnalysis(userId: string, diaryId: number) {
        await this.diaryService.diaryFindOne(userId, diaryId);

        const analysis = await this.diaryAnalysisRepository.findOne({
            where: {
               diary: {
                id: diaryId,
               }
            }
        });

        if(!analysis) {
            throw new NotFoundException('다이어리 분석 결과가 없습니다.');
        }

        return analysis;
    }
}
