import { Module } from '@nestjs/common';
import { DiaryAnalysisService } from './diary_analysis.service';
import { DiaryAnalysisController } from './diary_analysis.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaryAnalysis } from './entities/diary_analysis.entity';
import { DiaryModule } from '../diary/diary.module';
import { AiModule } from '../ai/ai.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiaryAnalysis]),
    DiaryModule,
    AiModule,
    RedisModule,
  ],
  controllers: [DiaryAnalysisController],
  providers: [DiaryAnalysisService],
})
export class DiaryAnalysisModule {}
