import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
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
    tryStartAnalysis: jest.fn<(diaryId: number) => Promise<boolean>>(),
    finishAnalysis: jest.fn<(diaryId: number) => Promise<void>>(),
  };

  const aiServiceMock = {
    analyzeDiary: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();

    diaryServiceMock.tryStartAnalysis.mockResolvedValue(true);
    diaryServiceMock.finishAnalysis.mockResolvedValue(undefined);

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

  it('다른 사람의 다이어리면 AI분석을 호출하지 않는다.', async () => {
    diaryServiceMock.diaryFindOne.mockImplementation(async () => {
      throw new NotFoundException();
    });

    const userId = 'user-a';
    const diaryId = 4;
    await expect(service.createAnalysis('user-a', 4)).rejects.toThrow(NotFoundException);
  });

  it('OpenAI 호출에 실패하면 분석 결과를 DB에 저장하지 않는다.', async () => {
    diaryServiceMock.diaryFindOne.mockImplementation(async() => ({
      id: 4,
      content: '오늘 기분이 좋다.',
    }));

    repositoryMock.findOne.mockImplementation(async () => null);

    aiServiceMock.analyzeDiary.mockImplementation(async () => {
      throw new ServiceUnavailableException();
    });

    await expect(service.createAnalysis('user', 4)).rejects.toThrow(ServiceUnavailableException);

    expect(repositoryMock.create).not.toHaveBeenCalled();
    expect(repositoryMock.save).not.toHaveBeenCalled();
    expect(diaryServiceMock.finishAnalysis).toHaveBeenCalledWith(4);
  });

  // ai 분석 동시 요청 문제 테스트
  it('다이어리 ai 분석을 동시에 여러번 하더라도 OpenAI는 한번만 호출 되어야 한다.', async () => {
    diaryServiceMock.diaryFindOne.mockImplementation(async() => ({
      id: 4,
      content: '오늘 기분이 좋다.',
    }));

    // 기존 ai분석이 없다는 전제
    repositoryMock.findOne.mockImplementation(async() => null);

    aiServiceMock.analyzeDiary.mockImplementation(async() => ({
      summary: '기분 좋은 하루',
      primaryEmotion: '행복',
      keywords: ['행복'],
      concerns: [],
      needs: [],
    }));

    repositoryMock.create.mockImplementation((data: any) => data);
    repositoryMock.save.mockImplementation((data: any) => data);

    let attempt = 0;

    diaryServiceMock.tryStartAnalysis.mockImplementation(async () => {
      attempt++;

     return attempt === 1;
    });

    const results = await Promise.allSettled([
      service.createAnalysis('user-a', 4),
      service.createAnalysis('user-a', 4),
    ]);

    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');
    expect(aiServiceMock.analyzeDiary).toHaveBeenCalledTimes(1);
    expect(diaryServiceMock.finishAnalysis).toHaveBeenCalledTimes(1);

  });
});