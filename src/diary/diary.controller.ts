import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { AccessTokenGuard } from '../auth/guard/access-token.guard';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { DiaryPaginationDto } from './dto/diary-pagination.dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DiaryListResponseDto } from './dto/diary-list-response.dto';
import { DiaryResponseDto } from './dto/diary-response.dto';
import { ApiDiaryId } from '../common/swagger/api-diary-id.decorator';
import { ApiAccessTokenResponse } from '../common/swagger/api-auth-response.decorator';

@ApiTags('Diary')
@ApiBearerAuth()
@ApiAccessTokenResponse()
@UseGuards(AccessTokenGuard)
@Controller('diaries')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  // 다이어리 생성
  @Post()
  @ApiOperation({
    summary: '다이어리 작성',
    description: '로그인한 사용자의 새로운 다이어리를 생성합니다.',
  })
  
  @ApiCreatedResponse({
    description: '다이어리 생성 성공',
    type: DiaryResponseDto,
  })
  @ApiBadRequestResponse({
    description: '요청 값 검증 실패',
  })
  createDiary(
    @CurrentUser('sub') userId:string,
    @Body() createDiaryDto: CreateDiaryDto
  ) {
    return this.diaryService.create(userId, createDiaryDto);
  }

  // 다이어리 전체 조회
  @Get()
  @ApiOperation({
    summary: '다이어리 목록 조회',
    description:
      '로그인한 사용자의 다이어리를 페이지 기반 페이지네이션으로 조회합니다.',
  })
  @ApiOkResponse({
    description: '다이어리 목록 조회 성공',
    type: DiaryListResponseDto,
  })
  @ApiBadRequestResponse({
    description: '페이지네이션 요청 값 검증 실패',
  })
  findAllDiaries(
    @CurrentUser('sub') userId: string,
    @Query() query: DiaryPaginationDto,
  ) {
    return this.diaryService.diaryFindAll(userId, query);
  }

  // 다이어리 상세 조회
  @Get(':id')
  @ApiOperation({
    summary: '다이어리 상세 조회',
    description: '본인이 작성한 특정 다이어리 한 건을 조회합니다.',
  })
  @ApiDiaryId()
  @ApiOkResponse({
    description: '다이어리 상세 조회 성공',
    type: DiaryResponseDto,
  })
  findOneDiary(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseIntPipe) diaryId: number, 
  ) {
    return this.diaryService.diaryFindOne(userId, diaryId);
  }

  // 다이어리 수정 업데이트
  @Patch(':id')
  @ApiOperation({
    summary: '다이어리 수정',
    description:
      '다이어리를 수정합니다. 다이어리의 본문 내용이 변경되면 기존 AI 분석 결과를 삭제합니다.',
  })
  @ApiDiaryId('다이어리 ID 또는 수정 요청 값의 형식이 올바르지 않음')
  @ApiOkResponse({
    description: '다이어리 수정 성공',
    type: DiaryResponseDto,
  })
  updateDiary(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseIntPipe) diaryId: number,
    @Body() updateDiaryDto: UpdateDiaryDto,
  ) {
    return this.diaryService.updateDiary(userId, diaryId, updateDiaryDto);
  }

  // 다이어리 삭제
  @Delete(':id')
   @ApiOperation({
    summary: '다이어리 삭제',
    description: '본인이 작성한 다이어리를 삭제합니다.',
  })
  @ApiDiaryId()
  @ApiOkResponse({
    description: '다이어리 삭제 성공',
    type: DiaryResponseDto,
  })
  deleteDiary(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseIntPipe) diaryId: number,
  ) {
    return this.diaryService.removeDiary(userId, diaryId);
  }
  
}
