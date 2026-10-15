import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { AccessTokenGuard } from '../auth/guard/access-token.guard';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { DiaryPaginationDto } from './dto/diary-pagination.dto';

@UseGuards(AccessTokenGuard)
@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  // 다이어리 생성
  @Post()
  createDiary(
    @CurrentUser('sub') userId:string,
    @Body() createDiaryDto: CreateDiaryDto
  ) {
    return this.diaryService.create(userId, createDiaryDto);
  }

  // 다이어리 전체 조회
  @Get()
  findAllDiaries(
    @CurrentUser('sub') userId: string,
    @Query() query: DiaryPaginationDto,
  ) {
    return this.diaryService.diaryFindAll(userId, query);
  }

  // 다이어리 상세 조회
  @Get(':id')
  findOneDiary(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseIntPipe) diaryId: number, 
  ) {
    return this.diaryService.diaryFindOne(userId, diaryId);
  }

  // 다이어리 수정 업데이트
  @Patch(':id')
  updateDiary(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseIntPipe) diaryId: number,
    @Body() updateDiaryDto: UpdateDiaryDto,
  ) {
    return this.diaryService.updateDiary(userId, diaryId, updateDiaryDto);
  }

  // 다이어리 삭제
  @Delete(':id')
  deleteDiary(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseIntPipe) diaryId: number,
  ) {
    return this.diaryService.removeDiary(userId, diaryId);
  }
  
}
