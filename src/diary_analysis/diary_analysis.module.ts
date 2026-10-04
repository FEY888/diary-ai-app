import { Module } from '@nestjs/common';
import { DiaryAnalysisService } from './diary_analysis.service';
import { DiaryAnalysisController } from './diary_analysis.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaryAnalysis } from './entities/diary_analysis.entity';
import { DiaryModule } from '../diary/diary.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiaryAnalysis]),
    DiaryModule,
    AiModule,
  ],
  controllers: [DiaryAnalysisController],
  providers: [DiaryAnalysisService],
})
export class DiaryAnalysisModule {}
