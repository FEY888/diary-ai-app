import {
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { DiaryService } from '../diary/diary.service';
import { InjectRepository } from '@nestjs/typeorm';
import { DiaryAnalysis } from './entities/diary_analysis.entity';
import { Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { DiaryAnalysisResponseDto } from './dto/response.dto';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';

const AI_DAILY_LIMIT = 10;
const AI_QUOTA_TTL_SECONDS = 60 * 60 * 24;

// INCR + EXPIRE를 Redis 안에서 한 번에(원자적으로) 실행: 첫 호출일 때만 24시간 만료 설정
const INCR_WITH_TTL_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
`;

@Injectable()
export class DiaryAnalysisService {
  constructor(
    @InjectRepository(DiaryAnalysis)
    private readonly diaryAnalysisRepository: Repository<DiaryAnalysis>,
    private readonly diaryService: DiaryService,
    private readonly aiService: AiService,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  // ai 분석 생성
  async createAnalysis(userId: string, diaryId: number) {
    const diary = await this.diaryService.diaryFindOne(userId, diaryId);

    // 기존 ai 분석 조회
    const existAnalysis = await this.diaryAnalysisRepository.findOne({
      where: {
        diary: {
          id: diaryId,
        },
      },
    });

    if (existAnalysis) {
      return this.toResponseDto(existAnalysis);
    }

    const lockStartedAt = await this.diaryService.tryStartAnalysis(diaryId);

    if (!lockStartedAt) {
      throw new ConflictException('이미 다이어리 AI분석 진행 중입니다.');
    }

    try {
      const lockedDiary = await this.diaryService.diaryFindOne(userId, diaryId);
      const existing = await this.diaryAnalysisRepository.findOne({
        where: {
          diary: {
            id: diaryId,
          },
        },
      });

      if (existing) {
        return this.toResponseDto(existing);
      }

      await this.consumeAiQuota(userId);

      const aiResult = await this.aiService.analyzeDiary(lockedDiary.content);

      const analysis = this.diaryAnalysisRepository.create({
        diary: lockedDiary,
        ...aiResult,
      });

      const saveAnalysis = await this.diaryAnalysisRepository.save(analysis);

      return this.toResponseDto(saveAnalysis);
    } finally {
      await this.diaryService.finishAnalysis(diaryId, lockStartedAt);
    }
  }

  // 다이어리 ai 분석 조회
  async findAnalysis(userId: string, diaryId: number) {
    await this.diaryService.diaryFindOne(userId, diaryId);

    const analysis = await this.diaryAnalysisRepository.findOne({
      where: {
        diary: {
          id: diaryId,
        },
      },
    });

    if (!analysis) {
      throw new NotFoundException('다이어리 분석 결과가 없습니다.');
    }

    return this.toResponseDto(analysis);
  }

  private async consumeAiQuota(userId: string) {
    const key = `ai-quota:${userId}`;
    const count = await this.redis.eval(
      INCR_WITH_TTL_SCRIPT,
      1,
      key,
      AI_QUOTA_TTL_SECONDS,
    );

    if (typeof count !== 'number') {
      throw new InternalServerErrorException('AI 사용량 확인에 실패했습니다.');
    }

    if (count > AI_DAILY_LIMIT) {
      throw new HttpException(
        `AI 분석은 24시간에 ${AI_DAILY_LIMIT}회 까지 가능합니다.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private toResponseDto(analysis: DiaryAnalysis): DiaryAnalysisResponseDto {
    return {
      id: analysis.id,
      summary: analysis.summary,
      reply: analysis.reply,
      primaryEmotion: analysis.primaryEmotion,
      keywords: analysis.keywords ?? [],
      concerns: analysis.concerns ?? [],
      needs: analysis.needs ?? [],
      createdAt: analysis.createdAt,
    };
  }
}
