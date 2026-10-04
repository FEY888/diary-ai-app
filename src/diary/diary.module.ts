import { Module } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { DiaryController } from './diary.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Diary } from './entities/diary.entity';
import { UsersModule } from '../users/users.module';
import { DiaryAnalysis } from '../diary_analysis/entities/diary_analysis.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Diary,
      DiaryAnalysis,
    ]),
    UsersModule,
  ],
  controllers: [DiaryController],
  providers: [DiaryService],
  exports: [DiaryService],
})
export class DiaryModule {}
