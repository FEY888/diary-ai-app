import { Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { DiaryAnalysisService } from './diary_analysis.service';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { AccessTokenGuard } from '../auth/guard/access-token.guard';
import { ApiBadRequestResponse, ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { ApiAccessTokenResponse } from '../common/swagger/api-auth-response.decorator';
import { DiaryAnalysisResponseDto } from './dto/response.dto';

@ApiTags('Diary Analysis')
@ApiBearerAuth()
@ApiAccessTokenResponse()
@UseGuards(AccessTokenGuard)
@Controller('diaries')
export class DiaryAnalysisController {
  constructor(private readonly diaryAnalysisService: DiaryAnalysisService) {}

  @Post(':diaryId/analysis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '다이어리 AI 분석 생성',
    description: '다이어리 내용을 OpenAI로 분석합니다. 기존 AI 분석이 존재하면 OpenAI를 다시 호출하지 않고 기존 분석 결과를 반환합니다.',
  })
  @ApiParam({
    name: 'diaryId',
    description: '분석할 다이어리 ID',
    type: Number,
    example: 4,
  })
  @ApiOkResponse({
    description: 'AI 분석 생성 또는 기존 분석 조회 성공',
    type: DiaryAnalysisResponseDto,
  })
  @ApiBadRequestResponse({
    description: '다이어리 ID 형식이 올바르지 않음',
  })
  @ApiNotFoundResponse({
    description: '다이어리를 찾을 수 없거나 해당 사용자의 다이어리가 아님',
  })
  @ApiServiceUnavailableResponse({
    description: 'OpenAI API 장애로 AI 분석 서비스를 사용할 수 없음',
  })
  async createAnalysis(
    @CurrentUser('sub') userId: string,
    @Param('diaryId', ParseIntPipe) diaryId: number, 
  ) {
    return this.diaryAnalysisService.createAnalysis(userId, diaryId);
  }

  @Get(':diaryId/analysis')
  @ApiOperation({
    summary: '다이어리 AI 분석 조회',
    description: '기존에 생성된 다이어리 AI 분석 결과를 조회합니다.'
  })
  @ApiParam({
    name: 'diaryId',
    description: '조회할 다이어리 ID',
    type: Number,
    example: 4,
  })
  @ApiOkResponse({
    description: 'AI 분석 조회 성공',
    type: DiaryAnalysisResponseDto,
  })
  @ApiBadRequestResponse({
    description: '다이어리 ID 형식이 올바르지 않음',
  })
  @ApiNotFoundResponse({
    description: '다이어리 또는 AI 분석 결과를 찾을 수 없음',
  })
  async findAnalysis(
    @CurrentUser('sub') userId: string,
    @Param('diaryId', ParseIntPipe) diaryId: number,
  ) {
    return this.diaryAnalysisService.findAnalysis(userId, diaryId);
  }
}
