import { Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { DiaryAnalysisService } from './diary_analysis.service';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { AccessTokenGuard } from '../auth/guard/access-token.guard';

@Controller('diaries')
export class DiaryAnalysisController {
  constructor(private readonly diaryAnalysisService: DiaryAnalysisService) {}

  @UseGuards(AccessTokenGuard)
  @Post(':diaryId/analysis')
  async createAnalysis(
    @CurrentUser('sub') userId: string,
    @Param('diaryId', ParseIntPipe) diaryId: number, 
  ) {
    return this.diaryAnalysisService.createAnalysis(userId, diaryId);
  }

  @UseGuards(AccessTokenGuard)
  @Get(':diaryId/analysis')
  async findAnalysis(
    @CurrentUser('sub') userId: string,
    @Param('diaryId', ParseIntPipe) diaryId: number,
  ) {
    return this.diaryAnalysisService.findAnalysis(userId, diaryId);
  }
}
