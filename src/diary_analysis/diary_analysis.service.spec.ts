import { DiaryAnalysisService } from './diary_analysis.service';
import { describe, beforeEach, jest, it, expect } from '@jest/globals';


// 다이어리AI 기존 분석이 있는데 OpenAI를 다시 호출하는 버그가 없는지 테스트
describe('DiaryAnalysisService', () => {
  let service: DiaryAnalysisService;

  const repositoryMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const diaryServiceMock = {
    diaryFindOne: jest.fn(),
  };

  const aiServiceMock = {
    analyzeDiary: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();

    service = new DiaryAnalysisService(
      repositoryMock as any,
      diaryServiceMock as any,
      aiServiceMock as any
    );
  });

  it('기존 분석이 있으면 OpenAI를 다시 호출하지 않는다.', async () => {
    //Given
    //다이어리가 존재하고, 기존ai분석이 존재한다.
    diaryServiceMock.diaryFindOne.mockImplementation(async () => ({
       id:4,
      content: '오늘 기분이 좋다.'
    }));

    repositoryMock.findOne.mockImplementation(async () => ({
      id:4,
      summary: '기존 분석 결과',
      primaryEmotion: '행복',
      keywords: ['기분'],
      concerns: [],
      needs: [],
      createdAt: new Date(),
    }));

     //When
    //createAnalysis() 다시 호출하기.
    const result = await service.createAnalysis('user', 4);

    // Then
    expect(aiServiceMock.analyzeDiary).not.toHaveBeenCalled();
    expect(result.summary).toBe('기존 분석 결과');
  });

  // 다이어리의 기존 AI 분석이 없을 때 OpenAI를 호출하고 분석 결과를 저장하는 테스트
  it('기존 분석이 없으면 OpenAI를 호출하고 분석 결과를 저장한다.', async() => {

    diaryServiceMock.diaryFindOne.mockImplementation(async () => ({
       id:4,
      content: '오늘 기분이 좋다.'
    }));

    repositoryMock.findOne.mockImplementation(async () => null);

    aiServiceMock.analyzeDiary.mockImplementation(async () => ({
      summary: '내일도 기분이 좋을 것 같다',
      primaryEmotion: '행복',
      keywords: ['행복', '기분'],
      concerns: [],
      needs: [],
    }));
    
    repositoryMock.create.mockImplementation((data: any) => ({
      ...data,
    }));
    repositoryMock.save.mockImplementation(async (data: any) => ({
      id: 5,
      ...data,
      createdAt: new Date(),
    }));

    const result = await service.createAnalysis('user', 4);

    expect(aiServiceMock.analyzeDiary).toHaveBeenCalledTimes(1);
    expect(repositoryMock.create).toHaveBeenCalledTimes(1);
    expect(repositoryMock.save).toHaveBeenCalledTimes(1);
  });
});