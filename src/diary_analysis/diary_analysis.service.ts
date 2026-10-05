import { Injectable, NotFoundException } from '@nestjs/common';
import { DiaryService } from '../diary/diary.service';
import { InjectRepository } from '@nestjs/typeorm';
import { DiaryAnalysis } from './entities/diary_analysis.entity';
import { Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { DiaryAnalysisResponseDto } from './dto/response.dto';

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
    return this.ResponseDto(existAnalysis);
  }

  const aiResult = await this.aiService.analyzeDiary(diary.content);

  const analysis = this.diaryAnalysisRepository.create({
    diary,
    ...aiResult,
  });

  const saveAnalysis = await this.diaryAnalysisRepository.save(analysis);

  return this.ResponseDto(saveAnalysis);
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

    private ResponseDto(
        analysis: DiaryAnalysis,
    ): DiaryAnalysisResponseDto {
        
        return {
            id: analysis.id,
            summary: analysis.summary,
            primaryEmotion: analysis.primaryEmotion,
            keywords: analysis.keywords ?? [],
            concerns: analysis.concerns ?? [],
            needs: analysis.needs ?? [],
            createAt: analysis.createdAt,
        };
    }
}
